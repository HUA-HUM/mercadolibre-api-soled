export interface CategoryAttributeAllowedValue {
  id: string;
  name: string;
}

export interface CategoryAttribute {
  id: string;
  name: string;
  value_type: string;
  required: boolean;
  allowed_values: CategoryAttributeAllowedValue[];
  allowed_units: string[];
  hint: string | null;
}

export interface CategoryAttributesResult {
  category_id: string;
  attributes: CategoryAttribute[];
}
