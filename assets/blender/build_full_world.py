"""WHO IS AI? - Expansive Central Plaza & World Builder
Builds a massive, stylized 3D city plaza (160m x 160m) with skyline skyscrapers,
twin modern pavilions, cafe clusters with parasols & tables, grand tiered fountains,
obelisk monuments, streetlamps, benches, trees, and detailed PBR materials.
Saves directly to a native Blender .blend project and exports optimized runtime GLB assets.
"""
import bpy
import math
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
BLEND_OUT = os.path.join(ROOT, 'assets', 'blender', 'who_is_ai_world.blend')
WEB_ASSETS = os.path.join(ROOT, 'apps', 'web', 'public', 'assets')
os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
os.makedirs(WEB_ASSETS, exist_ok=True)

def reset_blender():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

def get_or_create_collection(name, parent=None):
    if name in bpy.data.collections:
        col = bpy.data.collections[name]
    else:
        col = bpy.data.collections.new(name)
        if parent:
            parent.children.link(col)
        else:
            bpy.context.scene.collection.children.link(col)
    return col

def set_active_collection(col):
    layer_col = bpy.context.view_layer.layer_collection
    def find_layer_col(lc, target):
        if lc.collection == target:
            return lc
        for child in lc.children:
            res = find_layer_col(child, target)
            if res:
                return res
        return None
    target_lc = find_layer_col(layer_col, col)
    if target_lc:
        bpy.context.view_layer.active_layer_collection = target_lc

def create_mat(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=1.0, alpha=1.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = (*color[:3], alpha)
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if alpha < 1.0:
            if hasattr(mat, 'blend_method'):
                mat.blend_method = 'BLEND'
            if "Alpha" in bsdf.inputs:
                bsdf.inputs["Alpha"].default_value = alpha
        if emission:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = (*emission[:3], 1.0)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

def apply_mat(obj, mat):
    if not obj.data.materials:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat

def add_cube(loc, scale, mat=None, rot=(0,0,0), name="Cube"):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    if mat: apply_mat(o, mat)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o

def add_cyl(loc, r, depth, mat=None, rot=(0,0,0), vertices=24, name="Cylinder"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if mat: apply_mat(o, mat)
    return o

def add_cone(loc, r1, r2, depth, mat=None, rot=(0,0,0), vertices=16, name="Cone"):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if mat: apply_mat(o, mat)
    return o

def add_sphere(loc, r, mat=None, subdivisions=2, name="Sphere"):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    if mat: apply_mat(o, mat)
    return o

def add_torus(loc, r_major, r_minor, mat=None, rot=(0,0,0), name="Torus"):
    bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, major_radius=r_major, minor_radius=r_minor)
    o = bpy.context.object
    o.name = name
    if mat: apply_mat(o, mat)
    return o

# ==================== MATERIALS ====================
def init_materials():
    m = {}
    m['ground_dark'] = create_mat("M_PlazaAsphalt", (0.08, 0.11, 0.15), roughness=0.85)
    m['plaza_marble'] = create_mat("M_PlazaMarble", (0.22, 0.28, 0.35), roughness=0.6, metallic=0.08)
    m['plaza_center'] = create_mat("M_PlazaCenter", (0.32, 0.38, 0.46), roughness=0.5, metallic=0.15)
    m['paving_tile'] = create_mat("M_PavingTile", (0.18, 0.23, 0.30), roughness=0.7)
    m['strip_light'] = create_mat("M_StripGlow", (0.35, 0.85, 1.0), emission=(0.35, 0.85, 1.0), emission_strength=4.0)
    m['lawn_green'] = create_mat("M_LawnGrass", (0.13, 0.32, 0.20), roughness=0.9)

    m['granite_dark'] = create_mat("M_GraniteDark", (0.12, 0.14, 0.17), roughness=0.4, metallic=0.2)
    m['granite_light'] = create_mat("M_GraniteLight", (0.68, 0.72, 0.78), roughness=0.35, metallic=0.1)
    m['water_fountain'] = create_mat("M_WaterFountain", (0.20, 0.75, 0.95), roughness=0.1, emission=(0.15, 0.60, 0.85), emission_strength=2.2, alpha=0.8)
    m['fountain_gold'] = create_mat("M_FountainGold", (0.95, 0.78, 0.28), metallic=0.9, roughness=0.2)

    m['wood_deck'] = create_mat("M_WoodDeck", (0.55, 0.35, 0.18), roughness=0.55)
    m['metal_black'] = create_mat("M_MetalBlack", (0.10, 0.11, 0.13), roughness=0.35, metallic=0.85)
    m['glass_blue'] = create_mat("M_GlassBlue", (0.35, 0.75, 0.95), roughness=0.1, alpha=0.55)

    m['awning_red'] = create_mat("M_AwningRed", (0.85, 0.22, 0.18), roughness=0.6)
    m['awning_white'] = create_mat("M_AwningWhite", (0.92, 0.93, 0.95), roughness=0.6)
    m['canopy_cyan'] = create_mat("M_CanopyCyan", (0.15, 0.65, 0.75), roughness=0.5)
    m['cafe_counter'] = create_mat("M_CafeCounter", (0.62, 0.40, 0.22), roughness=0.45)
    m['cafe_interior'] = create_mat("M_CafeInterior", (1.0, 0.90, 0.65), emission=(1.0, 0.90, 0.65), emission_strength=2.5)

    m['gold_champagne'] = create_mat("M_GoldChampagne", (0.92, 0.76, 0.38), metallic=0.92, roughness=0.18)
    m['crystal_glow'] = create_mat("M_CrystalGlow", (0.45, 0.95, 0.85), roughness=0.1, emission=(0.45, 0.95, 0.85), emission_strength=3.5)

    m['wood_bark'] = create_mat("M_WoodBark", (0.26, 0.18, 0.12), roughness=0.85)
    m['foliage_lush'] = create_mat("M_FoliageLush", (0.16, 0.48, 0.26), roughness=0.75)
    m['foliage_cyan'] = create_mat("M_FoliageCyan", (0.12, 0.42, 0.40), roughness=0.75)
    m['foliage_autumn'] = create_mat("M_FoliageAutumn", (0.88, 0.45, 0.14), roughness=0.75)

    m['lamp_post'] = create_mat("M_LampPost", (0.14, 0.16, 0.19), metallic=0.7, roughness=0.35)
    m['lamp_light'] = create_mat("M_LampLight", (1.0, 0.82, 0.42), emission=(1.0, 0.82, 0.42), emission_strength=5.0)

    # Skyline Buildings
    m['building_glass_a'] = create_mat("M_BldgGlassA", (0.12, 0.22, 0.32), metallic=0.6, roughness=0.2)
    m['building_glass_b'] = create_mat("M_BldgGlassB", (0.18, 0.28, 0.38), metallic=0.5, roughness=0.25)
    m['building_concrete'] = create_mat("M_BldgConcrete", (0.24, 0.28, 0.34), roughness=0.7)
    m['window_lit'] = create_mat("M_WindowLit", (0.98, 0.92, 0.65), emission=(0.98, 0.92, 0.65), emission_strength=3.0)
    m['bldg_accent'] = create_mat("M_BldgAccent", (0.85, 0.25, 0.35), emission=(0.85, 0.25, 0.35), emission_strength=2.0)
    return m

# ==================== SCENE BUILDERS ====================
def build_ground_and_roads(col, m):
    set_active_collection(col)
    add_cube((0, 0, -0.2), (160, 160, 0.4), m['ground_dark'], name="Ground_OuterAsphalt")

    quad_offsets = [(-42, -42), (42, -42), (-42, 42), (42, 42)]
    for i, (qx, qy) in enumerate(quad_offsets):
        add_cube((qx, qy, 0.05), (42, 42, 0.1), m['lawn_green'], name=f"Park_Lawn_{i+1}")
        add_cube((qx, qy, 0.08), (43, 43, 0.06), m['paving_tile'], name=f"Park_Curb_{i+1}")

    add_cyl((0, 0, 0.12), 34, 0.24, m['plaza_marble'], vertices=32, name="Plaza_MainEsplanade")
    add_cyl((0, 0, 0.16), 22, 0.18, m['plaza_center'], vertices=32, name="Plaza_InnerRing")

    for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
        rad = math.radians(angle)
        dx = math.cos(rad) * 20
        dy = math.sin(rad) * 20
        add_cube((dx, dy, 0.26), (0.24, 18, 0.02), m['strip_light'], rot=(0, 0, rad - math.radians(90)), name=f"LightStrip_{angle}")

    add_cube((0, 48, 0.04), (12, 40, 0.08), m['plaza_marble'], name="Boulevard_North")
    add_cube((0, -48, 0.04), (12, 40, 0.08), m['plaza_marble'], name="Boulevard_South")
    add_cube((48, 0, 0.04), (40, 12, 0.08), m['plaza_marble'], name="Boulevard_East")
    add_cube((-48, 0, 0.04), (40, 12, 0.08), m['plaza_marble'], name="Boulevard_West")

def build_grand_fountain(col, m, loc=(0,0,0)):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cyl((lx, ly, lz + 0.35), 7.2, 0.7, m['granite_dark'], vertices=8, name="Fountain_OctagonOuter")
    add_cyl((lx, ly, lz + 0.45), 6.5, 0.6, m['water_fountain'], vertices=16, name="Fountain_WaterLevel1")
    add_cyl((lx, ly, lz + 1.1), 4.2, 0.8, m['granite_light'], vertices=24, name="Fountain_Tier2Basin")
    add_cyl((lx, ly, lz + 1.25), 3.8, 0.6, m['water_fountain'], vertices=24, name="Fountain_WaterLevel2")
    add_cyl((lx, ly, lz + 2.0), 2.1, 1.0, m['granite_dark'], vertices=16, name="Fountain_Tier3Basin")
    add_cyl((lx, ly, lz + 2.2), 1.8, 0.7, m['water_fountain'], vertices=16, name="Fountain_WaterLevel3")
    add_cyl((lx, ly, lz + 3.2), 0.35, 1.4, m['fountain_gold'], vertices=16, name="Fountain_SpireColumn")
    add_cone((lx, ly, lz + 4.1), 0.7, 0.05, 0.9, m['water_fountain'], vertices=16, name="Fountain_WaterJetSpray")

def build_modern_pavilion(col, m, loc, rot_z=0, name="Pavilion"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.25), (10, 7.5, 0.5), m['wood_deck'], rot=(0,0,rot_z), name=f"{name}_Deck")
    add_cube((lx, ly + 3.3, lz + 0.7), (9, 0.6, 0.45), m['wood_deck'], rot=(0,0,rot_z), name=f"{name}_BenchBack")

    pillar_offsets = [(-4.2, -3.0), (4.2, -3.0), (-4.2, 3.0), (4.2, 3.0)]
    for i, (px, py) in enumerate(pillar_offsets):
        rx = px * math.cos(rot_z) - py * math.sin(rot_z)
        ry = px * math.sin(rot_z) + py * math.cos(rot_z)
        add_cyl((lx + rx, ly + ry, lz + 2.4), 0.14, 3.8, m['metal_black'], name=f"{name}_Pillar_{i+1}")

    add_cube((lx, ly, lz + 4.4), (10.6, 8.2, 0.2), m['metal_black'], rot=(math.radians(6), 0, rot_z), name=f"{name}_RoofFrame")
    add_cube((lx, ly, lz + 4.42), (9.8, 7.4, 0.08), m['glass_blue'], rot=(math.radians(6), 0, rot_z), name=f"{name}_GlassSkylight")
    add_cube((lx, ly, lz + 4.2), (2.0, 2.0, 0.05), m['cafe_interior'], rot=(0, 0, rot_z), name=f"{name}_CeilingLight")

def build_cafe_cluster(col, m, loc, rot_z=0, name="Cafe"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 1.4), (4.2, 3.0, 2.8), m['granite_dark'], rot=(0,0,rot_z), name=f"{name}_Body")
    add_cube((lx, ly, lz + 2.85), (4.6, 3.4, 0.25), m['granite_light'], rot=(0,0,rot_z), name=f"{name}_Roof")

    fx = lx + math.sin(rot_z) * 1.55
    fy = ly - math.cos(rot_z) * 1.55
    add_cube((fx, fy, lz + 1.05), (3.2, 0.55, 0.12), m['cafe_counter'], rot=(0,0,rot_z), name=f"{name}_Counter")
    add_cube((fx, fy, lz + 1.7), (2.8, 0.1, 1.1), m['cafe_interior'], rot=(0,0,rot_z), name=f"{name}_InteriorGlow")

    for s in range(10):
        sx = -1.4 + s * 0.31
        mat = m['awning_red'] if s % 2 == 0 else m['awning_white']
        ox = sx * math.cos(rot_z) - (-1.75) * math.sin(rot_z)
        oy = sx * math.sin(rot_z) + (-1.75) * math.cos(rot_z)
        add_cube((lx + ox, ly + oy, lz + 2.65), (0.30, 1.2, 0.06), mat, rot=(math.radians(16), 0, rot_z), name=f"{name}_Awning_{s}")

    table_offsets = [(-4.5, -2.5), (4.5, -2.5), (0, -4.5)]
    for ti, (tx, ty) in enumerate(table_offsets):
        tx_r = tx * math.cos(rot_z) - ty * math.sin(rot_z)
        ty_r = tx * math.sin(rot_z) + ty * math.cos(rot_z)
        cx, cy = lx + tx_r, ly + ty_r

        add_cyl((cx, cy, lz + 0.42), 0.55, 0.84, m['wood_deck'], name=f"{name}_Table_{ti}")
        add_cyl((cx, cy, lz + 0.85), 0.75, 0.06, m['cafe_counter'], name=f"{name}_TableTop_{ti}")
        add_cyl((cx, cy, lz + 1.4), 0.04, 2.7, m['metal_black'], name=f"{name}_ParasolPole_{ti}")
        add_cone((cx, cy, lz + 2.6), 1.6, 0.08, 0.7, m['canopy_cyan'], name=f"{name}_ParasolCanopy_{ti}")

        for ci, c_ang in enumerate([math.radians(30), math.radians(210)]):
            ch_x = cx + math.cos(c_ang) * 0.95
            ch_y = cy + math.sin(c_ang) * 0.95
            add_cube((ch_x, ch_y, lz + 0.26), (0.42, 0.42, 0.52), m['metal_black'], name=f"{name}_Chair_{ti}_{ci}")
            add_cube((ch_x, ch_y, lz + 0.52), (0.44, 0.44, 0.08), m['wood_deck'], name=f"{name}_Seat_{ti}_{ci}")

def build_monument_sculpture(col, m, loc, name="Monument"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.3), (3.0, 3.0, 0.6), m['granite_dark'], name=f"{name}_Base1")
    add_cube((lx, ly, lz + 0.8), (2.2, 2.2, 0.5), m['granite_light'], name=f"{name}_Base2")
    add_torus((lx, ly, lz + 2.6), 1.4, 0.16, m['gold_champagne'], rot=(math.radians(40), math.radians(25), math.radians(15)), name=f"{name}_Ring1")
    add_torus((lx, ly, lz + 2.7), 1.2, 0.14, m['gold_champagne'], rot=(math.radians(-45), math.radians(55), math.radians(70)), name=f"{name}_Ring2")
    add_sphere((lx, ly, lz + 2.65), 0.42, m['crystal_glow'], subdivisions=3, name=f"{name}_Core")

def build_obelisk(col, m, loc, name="Obelisk"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.4), (2.4, 2.4, 0.8), m['granite_dark'], name=f"{name}_Plinth")
    add_cone((lx, ly, lz + 3.8), 0.9, 0.35, 6.0, m['granite_light'], vertices=4, rot=(0,0,math.radians(45)), name=f"{name}_Shaft")
    add_cone((lx, ly, lz + 7.1), 0.35, 0.0, 0.8, m['crystal_glow'], vertices=4, rot=(0,0,math.radians(45)), name=f"{name}_CrystalCap")

def build_tree_varieties(col, m, loc, kind=0, scale=1.0, name="Tree"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cyl((lx, ly, lz + 1.2 * scale), 0.22 * scale, 2.4 * scale, m['wood_bark'], vertices=8, name=f"{name}_Trunk")
    foliage_mat = [m['foliage_lush'], m['foliage_cyan'], m['foliage_autumn']][kind % 3]
    if kind % 2 == 0:
        add_sphere((lx, ly, lz + 2.6 * scale), 1.3 * scale, foliage_mat, subdivisions=2, name=f"{name}_Canopy1")
        add_sphere((lx + 0.3 * scale, ly - 0.2 * scale, lz + 3.4 * scale), 1.05 * scale, foliage_mat, subdivisions=2, name=f"{name}_Canopy2")
        add_sphere((lx - 0.2 * scale, ly + 0.3 * scale, lz + 4.1 * scale), 0.75 * scale, foliage_mat, subdivisions=2, name=f"{name}_CanopyTop")
    else:
        add_cone((lx, ly, lz + 2.2 * scale), 1.6 * scale, 0.3 * scale, 1.4 * scale, foliage_mat, vertices=7, name=f"{name}_Pine1")
        add_cone((lx, ly, lz + 3.1 * scale), 1.25 * scale, 0.2 * scale, 1.3 * scale, foliage_mat, vertices=7, name=f"{name}_Pine2")
        add_cone((lx, ly, lz + 4.0 * scale), 0.85 * scale, 0.05 * scale, 1.2 * scale, foliage_mat, vertices=7, name=f"{name}_PineTop")

def build_lamp_post(col, m, loc, name="Lamp"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cyl((lx, ly, lz + 0.3), 0.3, 0.6, m['lamp_post'], vertices=8, name=f"{name}_Base")
    add_cyl((lx, ly, lz + 2.1), 0.1, 3.2, m['lamp_post'], vertices=8, name=f"{name}_Pole")
    add_cube((lx, ly, lz + 3.65), (0.7, 0.12, 0.12), m['lamp_post'], name=f"{name}_CrossArm")
    add_cube((lx, ly, lz + 3.5), (0.34, 0.34, 0.46), m['lamp_post'], name=f"{name}_LanternFrame")
    add_cube((lx, ly, lz + 3.5), (0.24, 0.24, 0.36), m['lamp_light'], name=f"{name}_LanternGlow")

def build_bench(col, m, loc, rot_z=0, name="Bench"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx - 0.9 * math.cos(rot_z), ly - 0.9 * math.sin(rot_z), lz + 0.25), (0.1, 0.55, 0.5), m['metal_black'], rot=(0,0,rot_z), name=f"{name}_LegL")
    add_cube((lx + 0.9 * math.cos(rot_z), ly + 0.9 * math.sin(rot_z), lz + 0.25), (0.1, 0.55, 0.5), m['metal_black'], rot=(0,0,rot_z), name=f"{name}_LegR")
    add_cube((lx, ly, lz + 0.48), (2.1, 0.6, 0.08), m['wood_deck'], rot=(0,0,rot_z), name=f"{name}_SeatSlats")
    bx = lx - math.sin(rot_z) * 0.26
    by = ly + math.cos(rot_z) * 0.26
    add_cube((bx, by, lz + 0.8), (2.1, 0.08, 0.46), m['wood_deck'], rot=(math.radians(-8), 0, rot_z), name=f"{name}_BackSlats")

def build_skyline_tower(col, m, loc, size=(16, 16, 45), style=0, name="Tower"):
    set_active_collection(col)
    lx, ly, lz = loc
    w, d, h = size
    glass_mat = m['building_glass_a'] if style % 2 == 0 else m['building_glass_b']
    add_cube((lx, ly, lz + h/2), (w, d, h), glass_mat, name=f"{name}_Body")

    c_off = [(w*0.48, d*0.48), (-w*0.48, d*0.48), (w*0.48, -d*0.48), (-w*0.48, -d*0.48)]
    for ci, (cx, cy) in enumerate(c_off):
        add_cube((lx + cx, ly + cy, lz + h/2), (w*0.08, d*0.08, h + 0.5), m['building_concrete'], name=f"{name}_Pillar_{ci}")

    add_cube((lx, ly, lz + h + 1.2), (w * 0.65, d * 0.65, 2.4), m['building_concrete'], name=f"{name}_RoofLevel")
    add_cyl((lx, ly, lz + h + 5.0), 0.25, 6.0, m['metal_black'], vertices=8, name=f"{name}_Spire")
    add_sphere((lx, ly, lz + h + 8.1), 0.4, m['bldg_accent'], subdivisions=2, name=f"{name}_BeaconLight")

    floors = int(h / 4.0)
    for fl in range(1, floors, 2):
        zh = lz + fl * 4.0
        add_cube((lx, ly - d*0.505, zh), (w * 0.75, 0.08, 1.3), m['window_lit'], name=f"{name}_WinBand_{fl}")
        add_cube((lx + w*0.505, ly, zh), (0.08, d * 0.75, 1.3), m['window_lit'], name=f"{name}_SideWin_{fl}")

def build_surrounding_skyline(col, m):
    towers = [
        ((-50, 72), (20, 16, 52), 0),
        ((-18, 75), (22, 18, 68), 1),
        ((18, 75), (20, 18, 58), 0),
        ((52, 70), (18, 16, 46), 1),
        ((-48, -72), (22, 18, 50), 1),
        ((-16, -76), (18, 18, 62), 0),
        ((16, -76), (24, 20, 74), 1),
        ((50, -72), (20, 16, 48), 0),
        ((-75, -20), (18, 22, 54), 0),
        ((-75, 20), (18, 24, 60), 1),
        ((75, -20), (18, 22, 56), 1),
        ((75, 20), (18, 20, 64), 0),
    ]
    for i, ((tx, ty), size, style) in enumerate(towers):
        build_skyline_tower(col, m, (tx, ty, 0), size=size, style=style, name=f"Skyline_Tower_{i+1}")

def build_avatar_character(col, m, loc, coat_color, name="Avatar"):
    set_active_collection(col)
    lx, ly, lz = loc
    m_skin = create_mat("M_CharSkin", (0.95, 0.82, 0.70), roughness=0.6)
    m_hair = create_mat("M_CharHair", (0.15, 0.13, 0.18), roughness=0.7)
    m_coat = create_mat(f"M_Coat_{name}", coat_color, roughness=0.45)
    m_pants = create_mat("M_CharPants", (0.12, 0.14, 0.18), roughness=0.6)
    m_shoes = create_mat("M_CharShoes", (0.90, 0.92, 0.95), roughness=0.4)
    m_glow = create_mat("M_CharGlow", (0.35, 0.90, 0.85), emission=(0.35, 0.90, 0.85), emission_strength=2.5)

    add_cube((lx - 0.18, ly + 0.05, lz + 0.1), (0.12, 0.22, 0.1), m_shoes, name=f"{name}_ShoeL")
    add_cube((lx + 0.18, ly + 0.05, lz + 0.1), (0.12, 0.22, 0.1), m_shoes, name=f"{name}_ShoeR")
    add_cyl((lx - 0.18, ly, lz + 0.52), 0.11, 0.75, m_pants, name=f"{name}_LegL")
    add_cyl((lx + 0.18, ly, lz + 0.52), 0.11, 0.75, m_pants, name=f"{name}_LegR")
    add_cube((lx, ly, lz + 1.15), (0.34, 0.24, 0.45), m_coat, name=f"{name}_Hoodie")
    add_cube((lx, ly + 0.24, lz + 1.15), (0.04, 0.02, 0.44), m_glow, name=f"{name}_Zipper")
    add_cyl((lx - 0.42, ly, lz + 1.12), 0.09, 0.65, m_coat, rot=(0, math.radians(12), 0), name=f"{name}_ArmL")
    add_cyl((lx + 0.42, ly, lz + 1.12), 0.09, 0.65, m_coat, rot=(0, math.radians(-12), 0), name=f"{name}_ArmR")
    add_sphere((lx - 0.48, ly, lz + 0.78), 0.09, m_skin, name=f"{name}_HandL")
    add_sphere((lx + 0.48, ly, lz + 0.78), 0.09, m_skin, name=f"{name}_HandR")
    add_sphere((lx, ly, lz + 1.72), 0.26, m_skin, name=f"{name}_Head")
    add_sphere((lx, ly - 0.04, lz + 1.84), 0.27, m_hair, name=f"{name}_Hair")

def setup_lighting_and_camera(col):
    set_active_collection(col)
    sun_data = bpy.data.lights.new(name="SunLight", type='SUN')
    sun_data.energy = 4.2
    sun_data.color = (1.0, 0.94, 0.85)
    sun_obj = bpy.data.objects.new(name="SunLight", object_data=sun_data)
    sun_obj.location = (40, -50, 60)
    sun_obj.rotation_euler = (math.radians(52), math.radians(15), math.radians(-38))
    col.objects.link(sun_obj)

    fill_data = bpy.data.lights.new(name="SkyFillLight", type='SUN')
    fill_data.energy = 1.8
    fill_data.color = (0.55, 0.72, 0.95)
    fill_obj = bpy.data.objects.new(name="SkyFillLight", object_data=fill_data)
    fill_obj.location = (-40, 50, 40)
    fill_obj.rotation_euler = (math.radians(130), math.radians(-15), math.radians(45))
    col.objects.link(fill_obj)

    cam_data = bpy.data.cameras.new(name="MainCineCamera")
    cam_data.lens = 32
    cam_data.clip_end = 500
    cam_obj = bpy.data.objects.new(name="MainCineCamera", object_data=cam_data)
    cam_obj.location = (0, -46, 28)
    cam_obj.rotation_euler = (math.radians(64), 0, 0)
    col.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("PlazaWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = (0.05, 0.08, 0.14, 1.0)
        bg_node.inputs["Strength"].default_value = 1.0

# ==================== MAIN COMPILATION ====================
def build_all():
    print(">>> 1. Initializing clean Blender workspace...")
    reset_blender()

    col_root = bpy.context.scene.collection
    c_ground = get_or_create_collection("01_Plaza_Ground_Parks")
    c_water = get_or_create_collection("02_Central_Fountain_Water")
    c_arch = get_or_create_collection("03_Architecture_Pavilions")
    c_cafe = get_or_create_collection("04_Commercial_Cafes_Kiosks")
    c_monuments = get_or_create_collection("05_Art_Monuments_Sculptures")
    c_vegetation = get_or_create_collection("06_Vegetation_Trees_Lush")
    c_street = get_or_create_collection("07_Street_Lamps_Benches")
    c_skyline = get_or_create_collection("08_Surrounding_City_Skyline")
    c_avatars = get_or_create_collection("09_Characters_Avatars")
    c_studio = get_or_create_collection("10_Lighting_and_Cameras")

    print(">>> 2. Initializing rich PBR materials...")
    m = init_materials()

    print(">>> 3. Building expansive 160m x 160m terrain & promenades...")
    build_ground_and_roads(c_ground, m)

    print(">>> 4. Building Grand Tiered Fountain...")
    build_grand_fountain(c_water, m, loc=(0, 0, 0))

    print(">>> 5. Building Twin Modern Pavilions...")
    build_modern_pavilion(c_arch, m, loc=(22, -15, 0), rot_z=math.radians(-25), name="Pavilion_East")
    build_modern_pavilion(c_arch, m, loc=(-22, 15, 0), rot_z=math.radians(155), name="Pavilion_West")

    print(">>> 6. Building Commercial Cafes & Outdoor Seating Clusters...")
    build_cafe_cluster(c_cafe, m, loc=(-26, -20, 0), rot_z=math.radians(35), name="Cafe_Bistro_South")
    build_cafe_cluster(c_cafe, m, loc=(26, 20, 0), rot_z=math.radians(-145), name="Cafe_Bistro_North")

    print(">>> 7. Building Landmark Monuments...")
    build_monument_sculpture(c_monuments, m, loc=(8, 24, 0), name="Sculpture_Rings")
    build_obelisk(c_monuments, m, loc=(-8, -24, 0), name="Obelisk_Monument")

    print(">>> 8. Planting Tree Avenues and Diverse Flora...")
    tree_locs = [
        (-14, 10, 0), (-14, 22, 1), (-14, 34, 2),
        (14, 10, 1), (14, 22, 0), (14, 34, 2),
        (-14, -10, 2), (-14, -22, 0), (-14, -34, 1),
        (14, -10, 0), (14, -22, 2), (14, -34, 1),
        (-38, -38, 0), (-46, -34, 1), (-34, -46, 2),
        (38, -38, 1), (46, -34, 0), (34, -46, 2),
        (-38, 38, 2), (-46, 34, 0), (-34, 46, 1),
        (38, 38, 0), (46, 34, 2), (34, 46, 1),
        (-25, 42, 1), (25, 42, 0), (-25, -42, 2), (25, -42, 1)
    ]
    for i, (tx, ty, kind) in enumerate(tree_locs):
        sc = 0.9 + (i % 4) * 0.12
        build_tree_varieties(c_vegetation, m, (tx, ty, 0), kind=kind, scale=sc, name=f"Plaza_Tree_{i+1}")

    print(">>> 9. Installing Street Lamps and Seating Clusters...")
    lamp_locs = [
        (-10, 0), (10, 0), (0, -10), (0, 10),
        (-18, -18), (18, 18), (-18, 18), (18, -18),
        (-32, 0), (32, 0), (0, -32), (0, 32),
        (-28, -28), (28, 28), (-28, 28), (28, -28),
        (-48, -12), (-48, 12), (48, -12), (48, 12)
    ]
    for i, (lx, ly) in enumerate(lamp_locs):
        build_lamp_post(c_street, m, (lx, ly, 0), name=f"StreetLamp_{i+1}")

    bench_locs = [
        (-8, -6, 0), (8, 6, math.radians(180)),
        (-6, 8, math.radians(90)), (6, -8, math.radians(-90)),
        (-16, -12, math.radians(45)), (16, 12, math.radians(-135)),
        (-22, -8, 0), (22, 8, math.radians(180)),
        (-35, -35, math.radians(45)), (35, 35, math.radians(-135))
    ]
    for i, (bx, by, rz) in enumerate(bench_locs):
        build_bench(c_street, m, (bx, by, 0), rot_z=rz, name=f"Plaza_Bench_{i+1}")

    print(">>> 10. Constructing Majestic 160m Surrounding Skyline...")
    build_surrounding_skyline(c_skyline, m)

    print(">>> 11. Populating Demonstration Avatars...")
    build_avatar_character(c_avatars, m, (0, -3, 0), (0.15, 0.45, 0.65), name="Player_Hero")
    build_avatar_character(c_avatars, m, (3, -1, 0), (0.75, 0.25, 0.35), name="Stranger_NPC1")
    build_avatar_character(c_avatars, m, (-4, 2, 0), (0.22, 0.58, 0.42), name="Stranger_NPC2")

    print(">>> 12. Setting Up Professional Studio Lighting & Cine Camera...")
    setup_lighting_and_camera(c_studio)

    print(f">>> 13. SAVING NATIVE BLENDER PROJECT: {BLEND_OUT}")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    env_glb = os.path.join(WEB_ASSETS, "plaza_environment.glb")
    print(f">>> 14. EXPORTING EXPANSIVE ENVIRONMENT GLB: {env_glb}")
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if not obj.name.startswith("Avatar") and not obj.name.startswith("Stranger") and not obj.name.startswith("Player"):
            if obj.type == 'MESH':
                obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=env_glb,
        export_format='GLB',
        use_selection=True,
        export_apply=True
    )
    print("=== MEGA PLAZA BUILD COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    build_all()
