from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(BrandModel)
admin.site.register(CarModel)
admin.site.register(ModificationModel)
admin.site.register(OptionPropertiesModel)
admin.site.register(Options)
admin.site.register(ColorsModel)
admin.site.register(EquipmentsModel)