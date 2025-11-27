// Este archivo es nuestra "fuente de verdad" para los grupos de permisos.
// Lo importaremos en el Header y en el main.jsx.

export const PERMISSIONS = {
  USERS: [
    'add.users',
    'edit.users',
    'delete.users',
    'view.users',
    'edit.own.profile'
  ],
  PRODUCTS: [
    'add.products',
    'edit.products',
    'delete.products',
    'view.products'
  ],
  CATEGORY: [
    'add.category',
    'view.category',
    'edit.category',
    'delete.category',
  ],
  SUPPLIERS: [
    'add.suppliers',
    'edit.suppliers',
    'delete.suppliers',
    'view.suppliers'
  ],
  CLIENTS: [
    'add.clients',
    'edit.clients',
    'delete.clients',
    'view.clients'
  ],
  VISITS: [
    'add.visits',
    'edit.visits',
    'delete.visits',
    'assign.visits',
    'view.own.visits',
    'view.all.visits'
  ],
  ORDERS: [
    'add.order',
    'edit.order.content',
    'edit.order.status',
    'cancel.order',
    'view.own.order',
    'view.all.order'
  ],
  FINANCE: [ // Agrupé 'returns' bajo 'Finanzas'
    'issue.refund',
    'edit.return.status'
  ],
  PAYMENTS: [
    'add.payment',   // Registrar cobro
    'view.payments'  // Ver historial
  ],
  Company: [
    'manage.company',
    'manage.content'
  ]
};