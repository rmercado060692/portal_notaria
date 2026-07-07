class SignoRouter:
    """
    Router para controlar operaciones en la base de datos de SIGNO.
    SOLO PERMITE LECTURAS - NUNCA ESCRITURAS.
    """
    
    route_app_labels = {'signo'}
    
    def db_for_read(self, model, **hints):
        """
        Intentos de lectura van a la base de datos de signo.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'signo'
        return None
    
    def db_for_write(self, model, **hints):
        """
        NO PERMITIR NINGUNA ESCRITURA EN LA BASE DE DATOS DE SIGNO.
        """
        if model._meta.app_label in self.route_app_labels:
            # ¡NO PERMITIR ESCRITURAS EN SIGNO!
            return None
        return None
    
    def allow_relation(self, obj1, obj2, **hints):
        """
        Permitir relaciones si un modelo de la app signo está involucrado.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        NO PERMITIR MIGRACIONES EN LA BASE DE DATOS DE SIGNO.
        """
        if app_label in self.route_app_labels:
            # ¡NO PERMITIR MIGRACIONES EN SIGNO!
            return False
        return None
