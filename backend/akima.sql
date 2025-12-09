/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: akima
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0+deb12u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(7,'telefonos y accesorios','telefonos celulares y mas',NULL),
(8,'fundas','fundas para telefonos',7);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `status` enum('lead','active','inactive') NOT NULL DEFAULT 'lead',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_contact_date` date DEFAULT NULL,
  `follow_up_days` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES
(7,'Juan','Emiliano','akima@test.com','23232332332','lomas 5','rancho pancho','active','dwwed','2025-11-20 03:25:49',NULL,NULL);
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_info`
--

DROP TABLE IF EXISTS `company_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_info` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `legal_name` varchar(255) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_info`
--

LOCK TABLES `company_info` WRITE;
/*!40000 ALTER TABLE `company_info` DISABLE KEYS */;
INSERT INTO `company_info` VALUES
(1,'Alkima s.a','','','','5512345678','','','/uploads/company/logo-1764796694678-110960877.jpeg','2025-12-03 21:18:14');
/*!40000 ALTER TABLE `company_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('add','subtract','set') NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES
(1,11,8,'add',50,-79,-29,'Recepción de pedido de proveedor #XP-900','2025-11-28 20:51:39'),
(2,11,8,'add',20,-29,-9,'reabastecimiento de producto','2025-11-28 20:58:15'),
(3,10,8,'subtract',2,-18,-20,'aplastamiento','2025-11-28 20:58:31'),
(4,10,8,'subtract',2,-20,-22,'se danaron','2025-11-28 20:59:08'),
(5,11,8,'add',100,-9,91,'Reabastecimiento de mercancia','2025-11-28 21:24:54');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES
(8,8,10,'Teclado Mecánico RGB TKL',20,1899.99),
(9,8,11,'Fertilizante',100,12312.00),
(10,9,10,'Teclado Mecánico RGB TKL',20,1899.99),
(11,9,11,'Fertilizante',100,12312.00),
(12,10,10,'Teclado Mecánico RGB TKL',20,1899.99),
(13,10,11,'Fertilizante',100,12312.00),
(14,11,10,'Teclado Mecánico RGB TKL',20,1899.99),
(15,11,11,'Fertilizante',100,12312.00),
(18,12,10,'Teclado Mecánico RGB TKL',7,1899.99),
(20,13,10,'Teclado Mecánico RGB TKL',3,1899.99),
(21,13,11,'Fertilizante',1,12312.00),
(22,12,11,'Fertilizante',1,12312.00),
(23,14,10,'Teclado Mecánico RGB TKL',1,1899.99);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `processing_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(7,7,8,'cancelled',0.00,'Av. Siempre Viva 742, Springfield','Entregar solo por las tardes.','2025-11-20 03:28:19',NULL),
(8,7,8,'cancelled',1269199.80,'Av. Siempre Viva 742, Springfield','Entregar solo por las tardes.','2025-11-20 03:29:38',NULL),
(9,7,8,'shipped',1269199.80,'Av. Siempre Viva 742, Springfield','Entregar solo por las tardes.','2025-11-20 03:35:01',NULL),
(10,7,8,'cancelled',1269199.80,'Av. Siempre Viva 742, Springfield','Entregar solo por las tardes.','2025-11-20 03:35:09',NULL),
(11,7,8,'completed',1269199.80,'Av. Siempre Viva 742, Springfield','Entregar solo por las tardes.','2025-11-20 03:35:17',NULL),
(12,7,8,'processing',25611.93,'lomas 5 de mayo','llegar antes de las 3, cierran por dia festivo','2025-11-20 05:47:16',NULL),
(13,7,8,'completed',18011.97,'lomas 5','no ir en domingos','2025-11-20 05:56:48',NULL),
(14,7,8,'pending',1899.99,'lomas 5','','2025-12-09 03:39:02',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp(),
  `method` enum('cash','transfer','credit_card') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `fk_payments_user` (`user_id`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
(1,11,8,500.00,'2025-11-26 19:17:48','cash',NULL,'Pago parcial en mostrador'),
(2,11,8,10000.00,'2025-11-26 20:05:36','cash',NULL,'pago mostrador');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `display_order` tinyint(3) unsigned DEFAULT 0,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES
(13,11,'/uploads/products/1764300128270-717043387.webp',NULL,0,1,'2025-11-28 03:22:08'),
(14,11,'/uploads/products/1764300131144-102157722.webp',NULL,1,0,'2025-11-28 03:22:11'),
(15,10,'/uploads/products/1764300143364-40421326.webp',NULL,0,1,'2025-11-28 03:22:23'),
(16,10,'/uploads/products/1764300147315-967846859.webp',NULL,1,0,'2025-11-28 03:22:27');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `product_type` enum('product','service') NOT NULL DEFAULT 'product',
  `status` enum('active','inactive','draft','discontinued') NOT NULL DEFAULT 'draft',
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `supplier_id` bigint(20) unsigned DEFAULT NULL,
  `weight` decimal(8,2) DEFAULT NULL,
  `height` decimal(8,2) DEFAULT NULL,
  `width` decimal(8,2) DEFAULT NULL,
  `depth` decimal(8,2) DEFAULT NULL,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(10,'TEC-RGB-TKL-001','7501234567890','Teclado Mecánico RGB TKL','Teclado mecánico Tenkeyless con switches azules y retroiluminación RGB personalizable.',1899.99,1200.00,-23,'product','active',7,4,0.85,4.50,36.00,14.00,'{\"tipo_switch\":\"Blue Gateron\",\"formato\":\"TKL (Tenkeyless)\",\"conexion\":\"USB-C\"}',NULL,'2025-11-18 18:48:32','2025-12-09 03:39:02'),
(11,'5688sx','1232131','Fertilizante','fertilzante para campo',12312.00,1211.00,90,'product','active',8,4,34.00,10.00,14.00,45.00,'{\"color\":\"verde\"}','pasillo 2 estante 3','2025-11-18 19:07:49','2025-12-03 20:52:10');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_items`
--

DROP TABLE IF EXISTS `return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `return_id` bigint(20) unsigned NOT NULL,
  `order_item_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `unit_price_refunded` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `return_id` (`return_id`),
  KEY `order_item_id` (`order_item_id`),
  CONSTRAINT `return_items_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_items`
--

LOCK TABLES `return_items` WRITE;
/*!40000 ALTER TABLE `return_items` DISABLE KEYS */;
INSERT INTO `return_items` VALUES
(6,12,14,10,'Teclado Mecánico RGB TKL',2,1899.99),
(7,12,15,11,'Fertilizante',2,12312.00),
(8,13,12,10,'Teclado Mecánico RGB TKL',3,1899.99),
(9,13,13,11,'Fertilizante',3,12312.00),
(10,14,12,10,'Teclado Mecánico RGB TKL',2,1899.99),
(11,14,13,11,'Fertilizante',2,12312.00),
(12,15,23,10,'Teclado Mecánico RGB TKL',1,1899.99),
(13,16,12,10,'Teclado Mecánico RGB TKL',2,1899.99),
(14,16,13,11,'Fertilizante',2,12312.00),
(15,19,14,10,'Teclado Mecánico RGB TKL',2,1899.99),
(16,19,15,11,'Fertilizante',2,12312.00);
/*!40000 ALTER TABLE `return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `returns` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `total_refunded` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','completed','cancelled') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `client_id` (`client_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `returns_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returns`
--

LOCK TABLES `returns` WRITE;
/*!40000 ALTER TABLE `returns` DISABLE KEYS */;
INSERT INTO `returns` VALUES
(11,11,7,8,'producto con descuento',200.00,'2025-11-26 23:12:34','completed'),
(12,11,7,8,'sin stock',28423.98,'2025-11-27 00:39:31','completed'),
(13,10,7,8,'sin stock',42635.97,'2025-12-09 03:41:03','completed'),
(14,10,7,8,'sin stock',28423.98,'2025-12-09 03:41:27','completed'),
(15,14,7,8,'sin stock',1899.99,'2025-12-09 03:41:52','completed'),
(16,10,7,8,'sDASD',28423.98,'2025-12-09 03:43:15','cancelled'),
(17,10,7,8,'2222',222.00,'2025-12-09 03:55:43','cancelled'),
(18,11,7,8,'descuento',10000.00,'2025-12-09 04:12:03','completed'),
(19,11,7,8,'ddf',28423.98,'2025-12-09 04:19:52','pending');
/*!40000 ALTER TABLE `returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_visits`
--

DROP TABLE IF EXISTS `scheduled_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_visits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) NOT NULL,
  `scheduled_for` datetime NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `scheduled_visits_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scheduled_visits_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_visits`
--

LOCK TABLES `scheduled_visits` WRITE;
/*!40000 ALTER TABLE `scheduled_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduled_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `status` enum('activo','inactivo','potencial') NOT NULL DEFAULT 'activo',
  `notes` text DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `billing_email` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES
(4,'Akima','juan perez','akima@test.com','2222456789','lomas 5 de mayo','htttp://akima.com','activo',NULL,'232324242323','Net 30',NULL);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `Correo` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `sex` enum('M','F','O') DEFAULT NULL,
  `Passwd` varchar(255) NOT NULL,
  `fecha_registro` date DEFAULT curdate(),
  `Estado` tinyint(1) DEFAULT 0,
  `rol` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Correo` (`Correo`),
  UNIQUE KEY `Passwd` (`Passwd`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(8,'Admin F','admin@test.com','12121221212','','M','$2b$12$QcWa8uA.qf.4J/SQmTX4B.uR7xXLNbrqPacUCqEXYuRhmxqmeaaRO','2025-10-13',1,'admin'),
(9,'Juan Flores Actualizado','gerente@test.com','5512345678','Calle Nueva 123, Centro','M','$2b$12$wfg2Okp/lwc9OK5de4Tlve6nCg.4KLXmJTCtGgO7d0yGH4ORUKt.O','2025-10-13',1,'gerente'),
(10,'Lino Viveros','vendedor@test.com','234453','Calle Nueva 123, Centro','M','$2b$12$Vb0yMDJKKTVocEQzMoSxu.KjgprfNc8.JlCXdRWXZvmxtXbaFy.56','2025-10-13',1,'vendedor'),
(12,'Nuevo Vendedor','vendedor2@akima.com','55123456728','','M','$2b$12$03515XRfu86N.AMHnciNVeeozc5V0ScBT0Ba6M9NaGdsl1bNOII26','2025-11-26',1,'administracion'),
(13,'Prueba','preuba@test.com','1112221212','','M','$2b$12$kfgFTex7DN8v8vEM.DYpz.lQR.lvXDpHYl0ZvglmShQnP12IIKz3y','2025-11-26',1,'administracion');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_banners`
--

DROP TABLE IF EXISTS `website_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_banners` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `display_order` int(10) unsigned DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_banners`
--

LOCK TABLES `website_banners` WRITE;
/*!40000 ALTER TABLE `website_banners` DISABLE KEYS */;
INSERT INTO `website_banners` VALUES
(8,'/uploads/banners/banner-1764299579008-581663965.jpeg',NULL,NULL,2,1,'2025-11-28 03:12:59'),
(9,'/uploads/banners/banner-1764299585665-411200848.jpg',NULL,NULL,3,1,'2025-11-28 03:13:05'),
(10,'/uploads/banners/banner-1764299591258-850383775.webp',NULL,NULL,4,1,'2025-11-28 03:13:11'),
(11,'/uploads/banners/banner-1764299743757-733648481.webp',NULL,NULL,1,1,'2025-11-28 03:15:43');
/*!40000 ALTER TABLE `website_banners` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-08 22:39:01
