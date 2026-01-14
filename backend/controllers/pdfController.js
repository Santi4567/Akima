const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getConnection } = require('../config/database');

/**
 * Formatear dinero (MXN)
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

/**
 * [PROTEGIDO] Generar PDF de Orden (Versión Simplificada y Potente)
 * Body params: 
 * - reportType: 'simple' (Solo productos finales + IVA) | 'full' (Historial completo, devoluciones y pagos)
 */
const generateOrderPdf = async (req, res) => {
    let connection;
    try {
        const orderId = req.params.id;
        const { reportType = 'simple' } = req.body; // 'simple' o 'full'
        
        connection = await getConnection();

        // 1. Obtener Info Empresa
        const [companyInfo] = await connection.execute('SELECT * FROM company_info WHERE id = 1');
        const company = companyInfo[0] || {};

        // 2. Obtener Info Orden + Cliente + Vendedor
        const [orders] = await connection.execute(
            `SELECT o.*, 
                    CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                    c.address AS client_address,
                    c.phone AS client_phone,
                    c.email AS client_email,
                    u.Nombre AS seller_name
             FROM orders o
             JOIN clients c ON o.client_id = c.id
             JOIN users u ON o.user_id = u.ID
             WHERE o.id = ?`, 
            [orderId]
        );

        if (orders.length === 0) return res.status(404).json({ message: 'Orden no encontrada' });
        const order = orders[0];

        // 3. Obtener Items
        const [items] = await connection.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

        // 4. Obtener Devoluciones (Agrupadas por Item)
        // Esto nos dice cuánto se devolvió de cada producto
        const [returns] = await connection.execute(
            `SELECT ri.order_item_id, SUM(ri.quantity) as returned_qty, SUM(ri.quantity * oi.unit_price) as refunded_amount
             FROM return_items ri 
             JOIN returns r ON ri.return_id = r.id
             JOIN order_items oi ON ri.order_item_id = oi.id
             WHERE r.order_id = ? AND r.status != 'cancelled'
             GROUP BY ri.order_item_id`,
            [orderId]
        );

        // 5. Obtener Pagos (Abonos) - Solo necesario para reporte 'full'
        let totalPaid = 0;
        if (reportType === 'full') {
            const [payments] = await connection.execute(
                'SELECT SUM(amount) as total FROM payments WHERE order_id = ?', 
                [orderId]
            );
            totalPaid = parseFloat(payments[0].total || 0);
        }

        // =========================================================
        // PROCESAMIENTO DE DATOS
        // =========================================================
        
        let finalItems = [];
        let grandTotal = 0;

        // Mapear items con sus devoluciones
        items.forEach(item => {
            const ret = returns.find(r => r.order_item_id === item.id);
            const returnedQty = ret ? parseInt(ret.returned_qty) : 0;
            const finalQty = item.quantity - returnedQty;
            const itemTotal = parseFloat(item.unit_price) * item.quantity; // Total original

            // Lógica según reporte
            if (reportType === 'simple') {
                // Solo mostramos lo que quedó (finalQty > 0)
                if (finalQty > 0) {
                    finalItems.push({
                        description: item.product_name,
                        quantity: finalQty,
                        unit_price: parseFloat(item.unit_price),
                        total: finalQty * parseFloat(item.unit_price)
                    });
                }
            } else {
                // 'full': Mostramos todo
                finalItems.push({
                    description: item.product_name,
                    quantity: item.quantity, // Original
                    returned: returnedQty,   // Deuelto
                    unit_price: parseFloat(item.unit_price),
                    total: itemTotal
                });
            }
        });

        // Calcular Gran Total de los items finales
        grandTotal = finalItems.reduce((acc, item) => acc + item.total, 0);

        // =========================================================
        // GENERACIÓN DEL PDF
        // =========================================================
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Nota_${orderId}.pdf`);
        doc.pipe(res);

// --- ENCABEZADO (Logo y Datos Empresa) ---
        if (company.logo_path) {
            // Ajusta la ruta según tu estructura de carpetas
            const logoPath = path.join(__dirname, '..', company.logo_path); 
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 60 });
            }
        }

        doc.fontSize(20).text(company.name || 'Mi Empresa', 120, 50);
        doc.fontSize(10).text(company.address || '', 120, 75);
        doc.text(`Tel: ${company.phone || ''} | Email: ${company.email || ''}`, 120, 90);
        
        // --- DATOS DE LA NOTA ---
        doc.fontSize(12).text(reportType === 'simple' ? 'NOTA DE ENTREGA' : 'ESTADO DE CUENTA', 400, 50, { align: 'right' });
        doc.fontSize(10).text(`Folio: #${orderId}`, 400, 65, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 400, 80, { align: 'right' });

        doc.moveDown(4);

        // --- DATOS DEL CLIENTE ---
        doc.fontSize(11).font('Helvetica-Bold').text('Datos del Cliente:', 50, doc.y);
        doc.font('Helvetica').fontSize(10);
        doc.text(order.client_name);
        doc.text(order.client_address || 'Sin dirección');
        doc.text(`Tel: ${order.client_phone || '--'}`);
        doc.moveDown();

        // --- TABLA DE PRODUCTOS ---
        const tableTop = doc.y + 10;
        doc.font('Helvetica-Bold');
        
        // Encabezados de Tabla
        doc.text('Cant.', 50, tableTop);
        doc.text('Descripción', 100, tableTop);
        if (reportType === 'full') doc.text('Dev.', 300, tableTop); // Columna extra para devoluciones
        doc.text('P. Unit', 350, tableTop, { width: 60, align: 'right' });
        doc.text('Total', 420, tableTop, { width: 70, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
        doc.font('Helvetica');

        let yPosition = tableTop + 25;

        finalItems.forEach(item => {
            doc.text(item.quantity, 50, yPosition);
            doc.text(item.description, 100, yPosition, { width: 190 });
            
            if (reportType === 'full') {
                // Mostrar devoluciones en rojo si hay
                if (item.returned > 0) doc.fillColor('red').text(`-${item.returned}`, 300, yPosition).fillColor('black');
                else doc.text('-', 300, yPosition);
            }

            doc.text(formatCurrency(item.unit_price), 350, yPosition, { width: 60, align: 'right' });
            doc.text(formatCurrency(item.total), 420, yPosition, { width: 70, align: 'right' });
            
            yPosition += 20;
        });

        doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
        yPosition += 10;

        // =========================================================
        // TOTALES Y PIE DE PÁGINA
        // =========================================================

        if (reportType === 'simple') {
            // --- MODO SIMPLE: Desglose de IVA ---
            // Asumimos que los precios en BD YA INCLUYEN IVA (Precio Final)
            const totalFinal = grandTotal;
            const subtotal = totalFinal / 1.16;
            const iva = totalFinal - subtotal;

            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 350, yPosition, { width: 60, align: 'right' });
            doc.text(formatCurrency(subtotal), 420, yPosition, { width: 70, align: 'right' });
            yPosition += 15;

            doc.text('IVA (16%):', 350, yPosition, { width: 60, align: 'right' });
            doc.text(formatCurrency(iva), 420, yPosition, { width: 70, align: 'right' });
            yPosition += 15;

            doc.fontSize(12).text('TOTAL:', 350, yPosition, { width: 60, align: 'right' });
            doc.text(formatCurrency(totalFinal), 420, yPosition, { width: 70, align: 'right' });

        } else {
            // --- MODO FULL: Balance General ---
            // 1. Total Original
            // 2. Menos Devoluciones (Dinero)
            // 3. Nuevo Total
            // 4. Menos Pagos (Abonos)
            // 5. Restante
            
            // Calculamos cuánto dinero se devolvió en total
            // --- MODO FULL: Balance General (CORREGIDO) ---
            
            const totalRefunded = returns.reduce((acc, r) => acc + parseFloat(r.refunded_amount || 0), 0);
            const netTotal = grandTotal - totalRefunded;
            const remainingBalance = netTotal - totalPaid;

            doc.font('Helvetica-Bold');
            
            // AJUSTE AQUÍ:
            // 1. Moví X de 340 a 300 para dar más espacio a la izquierda.
            // 2. Aumenté el width de 70 a 120 para que quepan frases largas.
            // 3. Moví los valores a X=430 para separarlos bien.
            
            const labelX = 300;
            const labelW = 120; // Ancho suficiente para "Importe Pedido"
            const valueX = 430;
            const valueW = 80;

            // Total Pedido
            doc.text('Importe Pedido:', labelX, yPosition, { width: labelW, align: 'right' });
            doc.text(formatCurrency(grandTotal), valueX, yPosition, { width: valueW, align: 'right' });
            yPosition += 15;

            // Menos Devoluciones
            if (totalRefunded > 0) {
                doc.fillColor('red');
                doc.text('Devoluciones:', labelX, yPosition, { width: labelW, align: 'right' });
                doc.text(`- ${formatCurrency(totalRefunded)}`, valueX, yPosition, { width: valueW, align: 'right' });
                doc.fillColor('black');
                yPosition += 15;
            }

            // Nuevo Total
            doc.text('Total a Pagar:', labelX, yPosition, { width: labelW, align: 'right' });
            doc.text(formatCurrency(netTotal), valueX, yPosition, { width: valueW, align: 'right' });
            yPosition += 15;

            // Abonos
            doc.fillColor('green');
            doc.text('Abonado:', labelX, yPosition, { width: labelW, align: 'right' });
            doc.text(`- ${formatCurrency(totalPaid)}`, valueX, yPosition, { width: valueW, align: 'right' });
            doc.fillColor('black');
            yPosition += 25; // Un poco más de espacio antes del saldo final

            // Saldo Final
            // Dibujamos el recuadro un poco más ancho también
            doc.fontSize(12).rect(valueX - 90, yPosition - 5, 180, 20).fillAndStroke('#eee', '#000');
            
            doc.fillColor('black').text('SALDO PENDIENTE:', labelX, yPosition, { width: labelW, align: 'right' });
            doc.text(formatCurrency(remainingBalance), valueX, yPosition, { width: valueW, align: 'right' });
        }

        doc.end();

    } catch (error) {
        console.error('Error generando PDF:', error);
        if (!res.headersSent) res.status(500).json({ success: false, error: 'ERROR_PDF' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { generateOrderPdf };