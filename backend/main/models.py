from django.db import models

class CreateAndUpdate(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        abstract = True
        
        
        

class BrandModel(CreateAndUpdate):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
    
    
class CarModel(CreateAndUpdate):
    name  = models.CharField(max_length=100)
    brand = models.ForeignKey(BrandModel, on_delete=models.CASCADE, related_name='cars')
    image = models.ImageField(upload_to='cars/', blank=True, null=True)
    
    def __str__(self):
        return self.brand.name + " - " + self.name 
    
    class Meta:
        ordering = ['name']
    
    
class ModificationModel(CreateAndUpdate):
    name = models.CharField(max_length=100)
    engine_capacity = models.CharField(max_length=100, blank=True, null=True)
    car = models.ForeignKey(CarModel, on_delete=models.CASCADE, related_name='modifications')
    
    def __str__(self):
        return self.car.brand.name + " - " + self.car.name + " - " + self.name 
    
    class Meta:
        ordering = ['name']

# Create your models here.

    

class Options(CreateAndUpdate):
    name = models.CharField(blank=True, null=True, max_length=250)
    is_compare = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        

class OptionPropertiesModel(CreateAndUpdate):
    title = models.TextField(blank=True, null=True)
    options = models.ForeignKey(Options, on_delete=models.CASCADE, blank=True, null=True, related_name='properties')
    

    def __str__(self):
        return self.title + " - " + self.options.name
    
    class Meta:
        ordering = ["options__name", 'title']
    
    
    
class ColorsModel(CreateAndUpdate):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    price = models.IntegerField(blank=True, null=True)
    original = models.ImageField(upload_to='colors/', null=True, blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
    

class EquipmentsModel(CreateAndUpdate):
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    oldPrice = models.IntegerField()
    optionProperties = models.ManyToManyField(OptionPropertiesModel, blank=True, null=True)
    exterior_colors = models.ManyToManyField(ColorsModel, blank=True, related_name="exterior_colors")
    interior_colors = models.ManyToManyField(ColorsModel, blank=True, related_name='interior_colors')
    modification = models.ForeignKey(ModificationModel, on_delete=models.CASCADE, related_name='equipments')
    
    
    def __str__(self):
        return self.modification.car.brand.name + " - " + self.modification.car.name + " - " + self.name
    
    class Meta:
        ordering = ['price']

