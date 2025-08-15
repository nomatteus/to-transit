FROM php:8.2-apache

# Enable required Apache modules
RUN a2enmod ssl rewrite headers

# Configure PHP to suppress deprecation warnings in development
RUN echo "error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT" >> /usr/local/etc/php/conf.d/docker-php-config.ini \
    && echo "display_errors = Off" >> /usr/local/etc/php/conf.d/docker-php-config.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/docker-php-config.ini

# Create SSL directories
RUN mkdir -p /etc/ssl/private /etc/ssl/certs

# Copy mkcert certificates from host
COPY docker/certs/localhost+2.pem /etc/ssl/certs/localhost.crt
COPY docker/certs/localhost+2-key.pem /etc/ssl/private/localhost.key

# Set proper SSL file permissions
RUN chmod 600 /etc/ssl/private/localhost.key \
    && chmod 644 /etc/ssl/certs/localhost.crt

# Copy SSL configuration
COPY docker/ssl.conf /etc/apache2/sites-available/ssl.conf

# Enable SSL site and disable default
RUN a2ensite ssl && a2dissite 000-default

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80 443

CMD ["apache2-foreground"]