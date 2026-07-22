-- Catálogo inicial de Neumáticos y Aceites por categoría de máquina.
-- Basado en compras reales de Bodega (detalle_orden.asignado) cruzadas contra maquinas.nombre_maquina.
-- Usa subquery por nombre_categoria en vez de IDs fijos, para no depender de que los
-- autoincrementales de categorias_maquinas coincidan entre local y producción.
-- Idempotente: cada INSERT sólo corre si la combinación categoría+tipo+detalle no existe todavía.

-- Camionetas
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '245/70 R16', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Neumático' AND ci.detalle = '245/70 R16');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '265/65 R17', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Neumático' AND ci.detalle = '265/65 R17');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '255/70 R16', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Neumático' AND ci.detalle = '255/70 R16');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '245/75 R16', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Neumático' AND ci.detalle = '245/75 R16');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '245/70 R17', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Neumático' AND ci.detalle = '245/70 R17');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Aceite', 'Aceite caja de cambio', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camionetas'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camionetas' AND ci.tipo = 'Aceite' AND ci.detalle = 'Aceite caja de cambio');

-- Camion Tolva
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '13-22.5', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camion Tolva'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camion Tolva' AND ci.tipo = 'Neumático' AND ci.detalle = '13-22.5');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '9.00-22.5 10 perf Euro RSC', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camion Tolva'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camion Tolva' AND ci.tipo = 'Neumático' AND ci.detalle = '9.00-22.5 10 perf Euro RSC');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '12R.22.5', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camion Tolva'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camion Tolva' AND ci.tipo = 'Neumático' AND ci.detalle = '12R.22.5');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '13R22.5 tracción faena', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camion Tolva'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camion Tolva' AND ci.tipo = 'Neumático' AND ci.detalle = '13R22.5 tracción faena');

-- Microbus
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '215/75 R17.5', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Microbus'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Microbus' AND ci.tipo = 'Neumático' AND ci.detalle = '215/75 R17.5');

-- Pala
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '9.00-20', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Pala'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Pala' AND ci.tipo = 'Neumático' AND ci.detalle = '9.00-20');

-- Dumper
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '14-17.5', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Dumper'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Dumper' AND ci.tipo = 'Neumático' AND ci.detalle = '14-17.5');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '500/60-22.5', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Dumper'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Dumper' AND ci.tipo = 'Neumático' AND ci.detalle = '500/60-22.5');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', 'Llanta Dumper RSC50', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Dumper'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Dumper' AND ci.tipo = 'Neumático' AND ci.detalle = 'Llanta Dumper RSC50');

-- Excavadora
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Aceite', 'Aceite motor 800162284', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Excavadora'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Excavadora' AND ci.tipo = 'Aceite' AND ci.detalle = 'Aceite motor 800162284');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Aceite', 'Aceite motor 860918081', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Excavadora'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Excavadora' AND ci.tipo = 'Aceite' AND ci.detalle = 'Aceite motor 860918081');

-- Camion Pluma
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Neumático', '11 R22.5 tracción', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Camion Pluma'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Camion Pluma' AND ci.tipo = 'Neumático' AND ci.detalle = '11 R22.5 tracción');

-- Compresor De Aire
INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Aceite', 'Aceite unidad compresor PRO-TEC', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Compresor De Aire'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Compresor De Aire' AND ci.tipo = 'Aceite' AND ci.detalle = 'Aceite unidad compresor PRO-TEC');

INSERT INTO catalogo_insumos (id_categoria, tipo, detalle, activo, created_at, updated_at)
SELECT id_categoria, 'Aceite', 'Aceite motor SAE 15W-40', 1, NOW(), NOW() FROM categorias_maquinas WHERE nombre_categoria = 'Compresor De Aire'
AND NOT EXISTS (SELECT 1 FROM catalogo_insumos ci JOIN categorias_maquinas cm ON ci.id_categoria = cm.id_categoria WHERE cm.nombre_categoria = 'Compresor De Aire' AND ci.tipo = 'Aceite' AND ci.detalle = 'Aceite motor SAE 15W-40');
