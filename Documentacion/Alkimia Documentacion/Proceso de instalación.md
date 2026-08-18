

# Cosas a Instalar 

```
mysql 
mongodb
nginx
node 
pm2
```

# Paso 1 Clonar el Repo 

Dentro de la capeta `/opt/`

```bash 
git clone https://github.com/Santi4567/Akima.git
```


# Paso 2 Crear la BD 

```sql 
create database AlkimiaCRM;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'contrasena';

CREATE USER 'alkimia_user'@'%' IDENTIFIED BY 'tu_password_segura';
GRANT ALL PRIVILEGES ON AlkimiaCRM.* TO 'alkimia_user'@'%';
FLUSH PRIVILEGES;

```

# PASO 3 crear la bd 

```bash
sudo mysqldump -u root AlkimiaCRM < akima.sql 
```


