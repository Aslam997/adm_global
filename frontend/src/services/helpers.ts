export const formatPrice = (value?: number | null) =>
    value == null ? "—" : value.toLocaleString("fr-FR") + " so'm";