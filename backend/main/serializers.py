from rest_framework import serializers
from django.db.models import Min
from .models import *




class EquipmentSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentsModel
        fields = ("name", "price", "id")  # only name and price as requested
        read_only_fields = ("name", "price")



class CarModelSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    min_price = serializers.SerializerMethodField()
    equipments = serializers.SerializerMethodField()
    
    class Meta:
        model = CarModel
        fields = '__all__'
        
    def get_min_price(self, obj):
        agg = obj.modifications.aggregate(min_price=Min('equipments__price'))
        return agg['min_price']
    

    def get_equipments(self, obj):
        equipments_qs = []
        for mod in obj.modifications.all():
            for eq in getattr(mod, "equipments").all():
                equipments_qs.append(eq)
        return EquipmentSimpleSerializer(equipments_qs, many=True).data


class CompareListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='modification.car.brand.name', read_only=True)
    image = serializers.ImageField(source='modification.car.image', read_only=True, use_url=True)
    car_name = serializers.CharField(source='modification.car.name', read_only=True)

    class Meta:
        model = EquipmentsModel
        fields = ['name', 'price', 'brand_name', 'car_name', 'image', 'id' ]
        



class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionPropertiesModel
        fields = ["id", "title"]  

class SelectedEquipmentSerializer(serializers.ModelSerializer):
    """
    Return equipment info plus related car/brand and grouped options.
    """
    car_name = serializers.CharField(source="modification.car.name", read_only=True)
    brand_name = serializers.CharField(source="modification.car.brand.name", read_only=True)

    # exposed grouped options
    options = serializers.SerializerMethodField()

    class Meta:
        model = EquipmentsModel
        fields = [
            "id",
            "name",
            "price",
            "oldPrice",
            "car_name",
            "brand_name",
            "options",
        ]
        read_only_fields = fields

    def get_options(self, obj):
        # Get all properties related to this equipment, include their Options parent
        props_qs = obj.optionProperties.select_related("options").all()

        # Group properties by their options parent
        grouped = {}
        for prop in props_qs:
            opt = prop.options  # may be None
            if opt is None:
                key = ("__none__", None, "Other")
            else:
                key = (str(opt.id), opt.id, opt.name)

            grouped.setdefault(key, []).append(prop)

        result = []
        for (_, opt_id, opt_name), prop_list in grouped.items():
            result.append(
                {
                    "id": opt_id,
                    "name": opt_name,
                    "properties": PropertySerializer(prop_list, many=True, context=self.context).data,
                }
            )

        # Optionally: sort result by option name/id (stable)
        result.sort(key=lambda x: (x["name"] or "", x["id"] or 0))
        return result