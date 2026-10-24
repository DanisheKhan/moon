-- Seed Data for Star Enterprises
-- Inserts sample categories, brands, products, and units for Mobiles and Furniture & Electronics

do $$
declare
  v_mobiles_id uuid;
  v_fe_id uuid;
  v_cat_smartphones uuid;
  v_cat_secondhand uuid;
  v_cat_accessories uuid;
  v_cat_tv uuid;
  v_cat_fridge uuid;
  v_cat_furniture uuid;
  v_brand_apple uuid;
  v_brand_samsung uuid;
  v_brand_sony uuid;
  v_brand_lg uuid;
  v_prod_iphone15 uuid;
  v_prod_s24 uuid;
  v_prod_iphone13_sh uuid;
  v_prod_charger uuid;
  v_prod_sonytv uuid;
  v_prod_lgfridge uuid;
  v_prod_sofa uuid;
begin
  -- Fetch store IDs
  select id into v_mobiles_id from public.stores where code = 'mobiles';
  select id into v_fe_id from public.stores where code = 'furniture-electronics';

  if v_mobiles_id is not null and v_fe_id is not null then
    -- 1. MOBILES BRANDS & CATEGORIES
    insert into public.brands (store_id, name, slug) values
      (v_mobiles_id, 'Apple', 'apple'),
      (v_mobiles_id, 'Samsung', 'samsung'),
      (v_mobiles_id, 'OnePlus', 'oneplus')
    on conflict (store_id, slug) do nothing;

    select id into v_brand_apple from public.brands where store_id = v_mobiles_id and slug = 'apple';
    select id into v_brand_samsung from public.brands where store_id = v_mobiles_id and slug = 'samsung';

    insert into public.categories (store_id, name, slug, hsn_code) values
      (v_mobiles_id, 'Smartphones', 'smartphones', '8517'),
      (v_mobiles_id, 'Second-Hand Phones', 'second-hand-phones', '8517'),
      (v_mobiles_id, 'Accessories', 'accessories', '8504')
    on conflict (store_id, slug) do nothing;

    select id into v_cat_smartphones from public.categories where store_id = v_mobiles_id and slug = 'smartphones';
    select id into v_cat_secondhand from public.categories where store_id = v_mobiles_id and slug = 'second-hand-phones';
    select id into v_cat_accessories from public.categories where store_id = v_mobiles_id and slug = 'accessories';

    -- 2. MOBILES PRODUCTS
    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_mobiles_id, v_cat_smartphones, v_brand_apple, 'iPhone 15 Pro 128GB', 'iphone-15-pro-128gb', 'APL-IP15P-128', true, 110000, 124999, 118000, 18, '8517', 2, '{"storage": "128GB", "ram": "8GB", "color": "Natural Titanium", "display": "6.1 Super Retina XDR"}'::jsonb, 'Brand new Apple flagship smartphone.', '/images/products/iphone-15-pro.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_iphone15;

    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_mobiles_id, v_cat_smartphones, v_brand_samsung, 'Samsung Galaxy S24 256GB', 'samsung-s24-256gb', 'SAM-S24-256', true, 68000, 79999, 74000, 18, '8517', 2, '{"storage": "256GB", "ram": "8GB", "color": "Onyx Black", "display": "6.2 Dynamic AMOLED"}'::jsonb, 'Galaxy AI powered compact flagship.', '/images/products/samsung-s24.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_s24;

    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_mobiles_id, v_cat_secondhand, v_brand_apple, 'iPhone 13 128GB (Pre-Owned)', 'iphone-13-128gb-pre-owned', 'APL-IP13-PO', true, 31000, 38999, 35000, 18, '8517', 1, '{"storage": "128GB", "color": "Midnight", "battery_health": 88, "condition": "Grade A"}'::jsonb, 'Certified pre-owned iPhone 13, thoroughly tested.', '/images/products/iphone-13.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_iphone13_sh;

    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_mobiles_id, v_cat_accessories, v_brand_apple, 'Apple 20W USB-C Power Adapter', 'apple-20w-adapter', 'APL-20W-PWR', false, 1200, 1900, 1600, 18, '8504', 5, '{"wattage": "20W", "type": "USB-C"}'::jsonb, 'Original Apple 20W USB-C wall charger.', '/images/products/apple-20w-adapter.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_charger;

    -- Fetch product IDs if on conflict occurred
    if v_prod_iphone15 is null then select id into v_prod_iphone15 from public.products where store_id = v_mobiles_id and sku = 'APL-IP15P-128'; end if;
    if v_prod_s24 is null then select id into v_prod_s24 from public.products where store_id = v_mobiles_id and sku = 'SAM-S24-256'; end if;
    if v_prod_iphone13_sh is null then select id into v_prod_iphone13_sh from public.products where store_id = v_mobiles_id and sku = 'APL-IP13-PO'; end if;
    if v_prod_charger is null then select id into v_prod_charger from public.products where store_id = v_mobiles_id and sku = 'APL-20W-PWR'; end if;

    -- Units for Mobiles
    insert into public.product_units (product_id, store_id, serial_number, condition_grade, battery_health, purchase_cost, status, warranty_months)
    values
      (v_prod_iphone15, v_mobiles_id, '358941091234567', 'new', 100, 110000, 'in_stock', 12),
      (v_prod_iphone15, v_mobiles_id, '358941097654321', 'new', 100, 110000, 'in_stock', 12),
      (v_prod_s24, v_mobiles_id, '359871021111222', 'new', 100, 68000, 'in_stock', 12),
      (v_prod_iphone13_sh, v_mobiles_id, '354321098888999', 'A', 88, 31000, 'in_stock', 6)
    on conflict (serial_number) do nothing;

    -- Aggregate Inventory for Mobiles
    insert into public.inventory (store_id, product_id, quantity_on_hand) values
      (v_mobiles_id, v_prod_iphone15, 2),
      (v_mobiles_id, v_prod_s24, 1),
      (v_mobiles_id, v_prod_iphone13_sh, 1),
      (v_mobiles_id, v_prod_charger, 15)
    on conflict (store_id, product_id) do update set quantity_on_hand = excluded.quantity_on_hand;

    -- 3. FURNITURE & ELECTRONICS BRANDS & CATEGORIES
    insert into public.brands (store_id, name, slug) values
      (v_fe_id, 'Sony', 'sony'),
      (v_fe_id, 'LG', 'lg'),
      (v_fe_id, 'Samsung', 'samsung'),
      (v_fe_id, 'Bosch', 'bosch'),
      (v_fe_id, 'Royal Living', 'royal-living')
    on conflict (store_id, slug) do nothing;

    select id into v_brand_sony from public.brands where store_id = v_fe_id and slug = 'sony';
    select id into v_brand_lg from public.brands where store_id = v_fe_id and slug = 'lg';

    insert into public.categories (store_id, name, slug, hsn_code) values
      (v_fe_id, 'Televisions', 'televisions', '8528'),
      (v_fe_id, 'Refrigerators', 'refrigerators', '8418'),
      (v_fe_id, 'Washing Machines', 'washing-machines', '8450'),
      (v_fe_id, 'Living Room Furniture', 'living-room-furniture', '9401')
    on conflict (store_id, slug) do nothing;

    select id into v_cat_tv from public.categories where store_id = v_fe_id and slug = 'televisions';
    select id into v_cat_fridge from public.categories where store_id = v_fe_id and slug = 'refrigerators';
    select id into v_cat_furniture from public.categories where store_id = v_fe_id and slug = 'living-room-furniture';

    -- 4. FURNITURE & ELECTRONICS PRODUCTS
    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_fe_id, v_cat_tv, v_brand_sony, 'Sony Bravia 55" 4K Google TV', 'sony-bravia-55-4k', 'SNY-KD55-4K', true, 52000, 64990, 59000, 18, '8528', 2, '{"screen_size": "55 inch", "resolution": "4K Ultra HD", "refresh_rate": "60Hz", "os": "Google TV"}'::jsonb, 'Stunning 4K visual quality with Triluminos Pro.', '/images/products/sony-bravia-55.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_sonytv;

    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_fe_id, v_cat_fridge, v_brand_lg, 'LG 260L Double Door Refrigerator', 'lg-260l-double-door', 'LG-GL-T292', true, 23000, 28490, 26000, 18, '8418', 2, '{"capacity": "260 Litres", "energy_rating": "3 Star", "type": "Double Door", "color": "Shiny Steel"}'::jsonb, 'Smart inverter compressor refrigerator with fast ice making.', '/images/products/lg-refrigerator.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_lgfridge;

    insert into public.products (store_id, category_id, brand_id, name, slug, sku, is_serialized, cost_price, selling_price, min_selling_price, gst_rate, hsn_code, reorder_level, specs, description, image_url)
    values
      (v_fe_id, v_cat_furniture, null, '3-Seater Fabric Recliner Sofa', '3-seater-fabric-recliner-sofa', 'FUR-SOFA-3S-GRY', false, 24000, 34999, 30000, 12, '9401', 1, '{"dimensions": "210cm x 90cm x 95cm", "material": "Premium Suede Fabric", "color": "Slate Grey", "assembly_required": true}'::jsonb, 'Ergonomic manual reclining 3-seater sofa with high density foam.', '/images/products/recliner-sofa.jpg')
    on conflict (store_id, sku) do nothing
    returning id into v_prod_sofa;

    if v_prod_sonytv is null then select id into v_prod_sonytv from public.products where store_id = v_fe_id and sku = 'SNY-KD55-4K'; end if;
    if v_prod_lgfridge is null then select id into v_prod_lgfridge from public.products where store_id = v_fe_id and sku = 'LG-GL-T292'; end if;
    if v_prod_sofa is null then select id into v_prod_sofa from public.products where store_id = v_fe_id and sku = 'FUR-SOFA-3S-GRY'; end if;

    -- Units for Furniture & Electronics
    insert into public.product_units (product_id, store_id, serial_number, condition_grade, purchase_cost, status, warranty_months)
    values
      (v_prod_sonytv, v_fe_id, 'SNY2026TV5500192', 'new', 52000, 'in_stock', 24),
      (v_prod_lgfridge, v_fe_id, 'LGRF260L20268832', 'new', 23000, 'in_stock', 12),
      (v_prod_sofa, v_fe_id, 'FURSOFA202600109', 'new', 24000, 'in_stock', 12)
    on conflict (serial_number) do nothing;

    -- Aggregate Inventory for Furniture & Electronics
    insert into public.inventory (store_id, product_id, quantity_on_hand) values
      (v_fe_id, v_prod_sonytv, 3),
      (v_fe_id, v_prod_lgfridge, 3),
      (v_fe_id, v_prod_sofa, 3)
    on conflict (store_id, product_id) do update set quantity_on_hand = excluded.quantity_on_hand;

  end if;
end $$;
