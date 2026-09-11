"""WHO IS AI? - Ultra-Photorealistic Shanghai The Bund & Lujiazui Megacity
Packs dense, prominent landmarks right in front of the player's direct view:
- 5 cruise ships prominently clustered across the river channel (Flagship, Antique Dragon Boat, Catamaran, Ferry, Pilot)
- Dense Lujiazui skyline right across the river: Oriental Pearl, Shanghai Tower, SWFC, Jin Mao, Aurora Plaza with giant LED screen, Citigroup Tower, and 12 glowing skyscraper towers
- Expansive 8 heritage buildings along The Bund with brilliant golden amber floodlighting
- High-fidelity Victorian streetlamps with amber glowing glass and cast iron railings
"""
import bpy
import math
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
BLEND_OUT = os.path.join(ROOT, 'assets', 'blender', 'shanghai_bund.blend')
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
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
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
    m['river_bed'] = create_mat("M_RiverBed", (0.02, 0.05, 0.08), roughness=0.9)
    m['seawall_granite'] = create_mat("M_BundSeawall", (0.26, 0.28, 0.32), roughness=0.6, metallic=0.1)

    m['granite_deck'] = create_mat("M_BundGranite", (0.36, 0.39, 0.44), roughness=0.5, metallic=0.08)
    m['granite_tile_dark'] = create_mat("M_BundTileDark", (0.22, 0.24, 0.28), roughness=0.6)
    m['paving_curb'] = create_mat("M_BundCurb", (0.16, 0.18, 0.22), roughness=0.7)
    m['asphalt_road'] = create_mat("M_ZhongshanAsphalt", (0.07, 0.09, 0.12), roughness=0.85)
    m['road_line_w'] = create_mat("M_RoadStripeWhite", (0.95, 0.95, 0.95), roughness=0.4)
    m['road_line_y'] = create_mat("M_RoadStripeYellow", (0.98, 0.82, 0.18), roughness=0.4)
    m['lawn_park'] = create_mat("M_BundLawn", (0.08, 0.28, 0.15), roughness=0.85)
    m['cast_iron'] = create_mat("M_CastIronBlack", (0.07, 0.08, 0.10), metallic=0.92, roughness=0.28)
    m['wood_slat'] = create_mat("M_BenchWood", (0.55, 0.32, 0.16), roughness=0.45)

    m['lamp_bulb'] = create_mat("M_LampBulbWarm", (1.0, 0.88, 0.45), emission=(1.0, 0.88, 0.45), emission_strength=8.5)
    m['lamp_glass'] = create_mat("M_LampGlass", (1.0, 0.95, 0.70), roughness=0.1, alpha=0.6, emission=(1.0, 0.90, 0.55), emission_strength=3.5)
    m['bund_floodlight'] = create_mat("M_BundGoldenFlood", (1.0, 0.78, 0.28), emission=(1.0, 0.78, 0.28), emission_strength=6.0)
    m['led_strip'] = create_mat("M_DeckLEDStrips", (0.35, 0.88, 1.0), emission=(0.35, 0.88, 1.0), emission_strength=4.5)

    m['stone_classical'] = create_mat("M_HeritageStone", (0.58, 0.53, 0.46), roughness=0.55)
    m['stone_dark'] = create_mat("M_HeritageGraniteDark", (0.28, 0.26, 0.24), roughness=0.6)
    m['customs_brick'] = create_mat("M_CustomsRedBrick", (0.64, 0.26, 0.18), roughness=0.65)
    m['peace_copper'] = create_mat("M_PeaceGreenCopper", (0.18, 0.52, 0.40), metallic=0.35, roughness=0.4)
    m['clock_face'] = create_mat("M_CustomsClockFace", (1.0, 0.96, 0.82), emission=(1.0, 0.96, 0.82), emission_strength=7.0)
    m['dome_copper'] = create_mat("M_HSBCDomeCopper", (0.22, 0.48, 0.42), metallic=0.4, roughness=0.4)
    m['heritage_win_lit'] = create_mat("M_HeritageWinLit", (1.0, 0.85, 0.42), emission=(1.0, 0.85, 0.42), emission_strength=4.0)

    m['pearl_concrete'] = create_mat("M_PearlBody", (0.88, 0.90, 0.94), metallic=0.45, roughness=0.25)
    m['pearl_pink_neon'] = create_mat("M_PearlPinkNeon", (1.0, 0.18, 0.65), emission=(1.0, 0.18, 0.65), emission_strength=9.0)
    m['pearl_magenta_ring'] = create_mat("M_PearlMagentaRing", (0.92, 0.10, 0.55), emission=(0.92, 0.10, 0.55), emission_strength=8.0)
    m['shanghai_tower_glass'] = create_mat("M_ShanghaiTowerGlass", (0.16, 0.48, 0.72), metallic=0.88, roughness=0.12)
    m['swfc_glass'] = create_mat("M_SWFCGlass", (0.12, 0.32, 0.52), metallic=0.88, roughness=0.14)
    m['jinmao_facade'] = create_mat("M_JinMaoFacade", (0.75, 0.70, 0.58), metallic=0.90, roughness=0.20)
    m['aurora_gold'] = create_mat("M_AuroraGold", (0.95, 0.80, 0.30), metallic=0.85, roughness=0.25)
    m['aurora_screen'] = create_mat("M_AuroraScreenLED", (1.0, 0.35, 0.20), emission=(1.0, 0.35, 0.20), emission_strength=8.0)
    m['citi_blue'] = create_mat("M_CitiBlue", (0.15, 0.38, 0.65), metallic=0.85, roughness=0.20)
    m['citi_logo'] = create_mat("M_CitiLogo", (1.0, 0.25, 0.25), emission=(1.0, 0.25, 0.25), emission_strength=8.0)
    m['convention_globe'] = create_mat("M_ConventionGlobe", (0.2, 0.85, 0.95), roughness=0.15, emission=(0.25, 0.9, 1.0), emission_strength=10.0)
    m['lujiazui_win_cyan'] = create_mat("M_LujiazuiWinCyan", (0.35, 0.90, 1.0), emission=(0.35, 0.90, 1.0), emission_strength=6.0)
    m['lujiazui_win_white'] = create_mat("M_LujiazuiWinWhite", (0.95, 0.98, 1.0), emission=(0.95, 0.98, 1.0), emission_strength=5.5)
    m['lujiazui_accent_amber'] = create_mat("M_LujiazuiAccentAmber", (1.0, 0.75, 0.22), emission=(1.0, 0.75, 0.22), emission_strength=7.0)

    # Vivid High-Intensity Neon Lighting Palette
    m['neon_cyan'] = create_mat("M_NeonCyan", (0.20, 0.85, 1.0), emission=(0.20, 0.85, 1.0), emission_strength=12.0)
    m['neon_magenta'] = create_mat("M_NeonMagenta", (1.0, 0.15, 0.75), emission=(1.0, 0.15, 0.75), emission_strength=12.0)
    m['neon_amber'] = create_mat("M_NeonAmber", (1.0, 0.78, 0.20), emission=(1.0, 0.78, 0.20), emission_strength=12.0)
    m['neon_red'] = create_mat("M_NeonRed", (1.0, 0.12, 0.12), emission=(1.0, 0.12, 0.12), emission_strength=12.0)
    m['neon_emerald'] = create_mat("M_NeonEmerald", (0.10, 0.95, 0.55), emission=(0.10, 0.95, 0.55), emission_strength=12.0)
    m['neon_purple'] = create_mat("M_NeonPurple", (0.75, 0.25, 1.0), emission=(0.75, 0.25, 1.0), emission_strength=12.0)

    m['boat_hull'] = create_mat("M_BoatHullWhite", (0.95, 0.95, 0.97), roughness=0.25)
    m['boat_red'] = create_mat("M_BoatWaterlineRed", (0.88, 0.15, 0.12), roughness=0.35)
    m['boat_blue'] = create_mat("M_BoatStripeBlue", (0.12, 0.35, 0.72), roughness=0.35)
    m['boat_deck'] = create_mat("M_BoatDeckTeak", (0.65, 0.44, 0.24), roughness=0.45)
    m['boat_window'] = create_mat("M_BoatWinLit", (1.0, 0.92, 0.55), emission=(1.0, 0.92, 0.55), emission_strength=7.5)
    m['lantern_red'] = create_mat("M_BoatLanternRed", (1.0, 0.20, 0.12), emission=(1.0, 0.20, 0.12), emission_strength=8.0)

    m['tree_trunk'] = create_mat("M_TreeBark", (0.24, 0.17, 0.12), roughness=0.85)
    m['tree_leaf'] = create_mat("M_TreeLeafGreen", (0.14, 0.44, 0.22), roughness=0.75)
    return m

# ==================== BUILDERS ====================

def build_river_channel(col, m):
    set_active_collection(col)
    # Vast Huangpu River (124m wide channel from Y: 11.2 to Y: 135.0)
    add_cube((0, 73.1, -2.4), (280, 123.8, 0.6), m['river_bed'], name="Huangpu_Deep_Channel_Bed")
    add_cube((0, 11.2, 0.0), (250, 1.4, 2.4), m['seawall_granite'], name="Bund_FloodSeawall")
    add_cube((0, 135.0, 0.0), (250, 1.4, 2.4), m['seawall_granite'], name="Pudong_Seawall")

def build_bund_promenade_and_street(col, m):
    set_active_collection(col)
    # The Bund Elevated Promenade: Continuous flat level deck from Y: 11.2 to Y: -12.0 at height Z: 1.2
    # 260m wide, 23.2m deep, top surface at Z = 1.2
    add_cube((0, -0.4, 0.6), (260, 23.2, 1.2), m['granite_deck'], name="Bund_ElevatedPromenade")
    add_cube((0, 10.8, 1.24), (260, 0.8, 0.08), m['paving_curb'], name="Bund_Promenade_RiverCurb")
    add_cube((0, 1.0, 1.21), (260, 1.8, 0.02), m['granite_tile_dark'], name="Bund_DecorativeTile")

    rail_len = 250
    steps = int(rail_len / 3.5)
    for i in range(steps):
        rx = -125 + i * 3.5
        add_cyl((rx, 10.85, 1.75), 0.06, 1.1, m['cast_iron'], name=f"Railing_Post_{i}")
        add_sphere((rx, 10.85, 2.32), 0.09, m['cast_iron'], name=f"Railing_Finial_{i}")
        if i < steps - 1:
            add_cube((rx + 1.75, 10.85, 2.22), (3.5, 0.06, 0.06), m['cast_iron'], name=f"Railing_Top_{i}")
            add_cube((rx + 1.75, 10.85, 1.75), (3.5, 0.04, 0.04), m['cast_iron'], name=f"Railing_Mid_{i}")
            add_cube((rx + 1.75, 10.85, 1.35), (3.5, 0.04, 0.04), m['cast_iron'], name=f"Railing_Bot_{i}")
            for sp in [0.85, 1.75, 2.65]:
                add_cyl((rx + sp, 10.85, 1.78), 0.025, 0.85, m['cast_iron'], name=f"Railing_Spindle_{i}_{sp}")

    for lx in range(-110, 115, 10):
        # Floor strip embedded slightly in granite floor, narrow subtle glow
        add_cube((lx, 3.0, 1.205), (0.06, 2.5, 0.005), m['led_strip'], name=f"Floor_Strip_{lx}")

    # Behind the elevated promenade (Y < -12.0)
    add_cube((0, -12.8, 0.6), (260, 1.6, 1.2), m['paving_curb'], name="Bund_StairsBuffer")
    add_cube((0, -15.5, 0.2), (260, 4.0, 0.4), m['lawn_park'], name="Bund_GreenwayPark")

    add_cube((0, -26.0, -0.05), (260, 17.0, 0.1), m['asphalt_road'], name="Zhongshan_Road_Asphalt")
    for lx in range(-110, 115, 10):
        add_cube((lx, -23.0, 0.02), (5.0, 0.2, 0.01), m['road_line_w'], name=f"Road_Lane1_{lx}")
        add_cube((lx, -29.0, 0.02), (5.0, 0.2, 0.01), m['road_line_w'], name=f"Road_Lane2_{lx}")
    add_cube((0, -26.0, 0.02), (260, 0.25, 0.01), m['road_line_y'], name="Road_YellowDoubleLine")
    for cross_x in [-75, -45, -15, 15, 45, 75]:
        for si in range(7):
            sy = -32.0 + si * 2.0
            add_cube((cross_x, sy, 0.02), (4.2, 0.9, 0.01), m['road_line_w'], name=f"Zebra_{cross_x}_{si}")
    add_cube((0, -36.5, 0.1), (260, 4.0, 0.2), m['granite_deck'], name="Heritage_FrontSidewalk")

def build_bund_lamp(col, m, loc, name="BundLamp"):
    set_active_collection(col)
    lx, ly, lz = loc
    # Realistic Victorian streetlamp proportions (slender, elegant, not chunky)
    add_cyl((lx, ly, lz + 0.3), 0.22, 0.6, m['cast_iron'], vertices=10, name=f"{name}_Pedestal")
    add_cyl((lx, ly, lz + 2.0), 0.07, 2.8, m['cast_iron'], vertices=8, name=f"{name}_Column")
    add_cube((lx, ly, lz + 3.4), (1.0, 0.06, 0.06), m['cast_iron'], name=f"{name}_CrossArm")
    add_cone((lx, ly, lz + 3.65), 0.08, 0.01, 0.35, m['cast_iron'], name=f"{name}_ApexFinial")

    for side, dx in [("L", -0.48), ("R", 0.48)]:
        px, py, pz = lx + dx, ly, lz + 3.35
        add_cone((px, py, pz + 0.22), 0.16, 0.04, 0.15, m['cast_iron'], vertices=4, rot=(0,0,math.radians(45)), name=f"{name}_Hood_{side}")
        add_cone((px, py, pz - 0.20), 0.04, 0.14, 0.12, m['cast_iron'], vertices=4, rot=(0,0,math.radians(45)), name=f"{name}_BaseCup_{side}")
        add_cube((px, py, pz), (0.22, 0.22, 0.28), m['lamp_glass'], rot=(0,0,math.radians(45)), name=f"{name}_LanternGlass_{side}")
        add_sphere((px, py, pz), 0.08, m['lamp_bulb'], subdivisions=2, name=f"{name}_Bulb_{side}")

def build_bund_bench(col, m, loc, rot_z=0, name="BundBench"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx - 0.9*math.cos(rot_z), ly - 0.9*math.sin(rot_z), lz + 0.25), (0.08, 0.55, 0.5), m['cast_iron'], rot=(0,0,rot_z), name=f"{name}_LegL")
    add_cube((lx + 0.9*math.cos(rot_z), ly + 0.9*math.sin(rot_z), lz + 0.25), (0.08, 0.55, 0.5), m['cast_iron'], rot=(0,0,rot_z), name=f"{name}_LegR")
    add_cube((lx, ly, lz + 0.48), (2.1, 0.58, 0.08), m['wood_slat'], rot=(0,0,rot_z), name=f"{name}_Seat")
    bx = lx - math.sin(rot_z) * 0.25
    by = ly + math.cos(rot_z) * 0.25
    add_cube((bx, by, lz + 0.8), (2.1, 0.08, 0.46), m['wood_slat'], rot=(math.radians(-8), 0, rot_z), name=f"{name}_Back")

# ==================== 8 THE BUND HERITAGE BUILDINGS ====================

def build_peace_hotel(col, m, loc=(-18, -48, 0)):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 14), (28, 22, 28), m['stone_classical'], name="Peace_Hotel_Base")
    add_cube((lx, ly, lz + 31), (22, 18, 6), m['stone_dark'], name="Peace_Hotel_Tier2")
    add_cube((lx, ly + 2, lz + 37), (14, 14, 6), m['stone_classical'], name="Peace_Hotel_TowerBlock")
    add_cone((lx, ly + 2, lz + 46), 6.5, 0.0, 12.0, m['peace_copper'], vertices=4, rot=(0,0,math.radians(45)), name="Peace_Hotel_PyramidRoof")
    add_cyl((lx, ly + 2, lz + 54), 0.15, 5.0, m['cast_iron'], name="Peace_Hotel_Flagpole")
    add_cube((lx, ly + 11.2, lz + 2.0), (27, 0.4, 0.3), m['bund_floodlight'], name="Peace_Hotel_FloodGlow")
    add_cube((lx, ly + 11.2, lz + 28.2), (24, 0.4, 0.3), m['bund_floodlight'], name="Peace_Hotel_UpperFlood")
    # Fairmont canopy marquee
    add_cube((lx, ly + 11.8, lz + 4.5), (8.0, 2.5, 0.4), m['peace_copper'], name="Peace_Hotel_Canopy")
    add_cube((lx, ly + 11.8, lz + 4.2), (7.6, 0.1, 0.4), m['bund_floodlight'], name="Peace_Hotel_MarqueeLit")
    for fl in range(2, 9, 2):
        zh = lz + fl * 3.2
        add_cube((lx, ly + 11.05, zh), (22, 0.12, 1.4), m['heritage_win_lit'], name=f"Peace_Hotel_Win_{fl}")

def build_customs_house(col, m, loc=(18, -48, 0)):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 13), (30, 22, 26), m['stone_classical'], name="Customs_MainBlock")
    for cx in range(-12, 16, 6):
        add_cyl((lx + cx, ly + 11.2, lz + 8.0), 0.9, 14.0, m['stone_dark'], vertices=12, name=f"Customs_Col_{cx}")
    add_cube((lx, ly + 11.2, lz + 16.5), (28, 1.2, 2.0), m['stone_dark'], name="Customs_Entablature")
    add_cube((lx, ly + 1.0, lz + 33), (12, 12, 14), m['customs_brick'], name="Customs_ClockTower_Base")
    add_cube((lx, ly + 1.0, lz + 42), (10, 10, 6), m['customs_brick'], name="Customs_ClockStage")
    # 4-sided illuminated Roman clock dials (Big Ching Clock)
    add_cyl((lx, ly + 6.15, lz + 42), 2.2, 0.3, m['clock_face'], rot=(math.radians(90), 0, 0), name="Customs_Clock_Front")
    add_cyl((lx, ly - 4.15, lz + 42), 2.2, 0.3, m['clock_face'], rot=(math.radians(90), 0, 0), name="Customs_Clock_Back")
    add_cyl((lx - 5.15, ly + 1.0, lz + 42), 2.2, 0.3, m['clock_face'], rot=(0, math.radians(90), 0), name="Customs_Clock_West")
    add_cyl((lx + 5.15, ly + 1.0, lz + 42), 2.2, 0.3, m['clock_face'], rot=(0, math.radians(90), 0), name="Customs_Clock_East")
    # Clock hands center hub and pointers
    add_sphere((lx, ly + 6.32, lz + 42), 0.3, m['cast_iron'], name="Customs_Clock_Hub")
    add_cube((lx, ly + 6.33, lz + 42.8), (0.15, 0.05, 1.3), m['cast_iron'], name="Customs_Clock_HourHand")
    add_cube((lx + 0.6, ly + 6.33, lz + 42), (1.4, 0.05, 0.12), m['cast_iron'], name="Customs_Clock_MinHand")
    add_cyl((lx, ly + 1.0, lz + 46.5), 3.2, 3.0, m['stone_classical'], vertices=16, name="Customs_Cupola")
    add_sphere((lx, ly + 1.0, lz + 48.8), 2.8, m['peace_copper'], subdivisions=2, name="Customs_Dome")
    add_cyl((lx, ly + 1.0, lz + 53.0), 0.15, 6.0, m['cast_iron'], name="Customs_Spire")
    add_cube((lx, ly + 11.2, lz + 1.5), (30, 0.4, 0.3), m['bund_floodlight'], name="Customs_BaseFlood")

def build_hsbc_building(col, m, loc=(48, -48, 0)):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 13), (28, 22, 26), m['stone_classical'], name="HSBC_Body")
    for cx in [-9, -3, 3, 9]:
        add_cyl((lx + cx, ly + 11.2, lz + 8.5), 0.8, 15.0, m['stone_dark'], vertices=12, name=f"HSBC_Col_{cx}")
    add_cyl((lx, ly + 1.0, lz + 28), 6.5, 4.0, m['stone_dark'], vertices=16, name="HSBC_DomeDrum")
    add_sphere((lx, ly + 1.0, lz + 32), 6.0, m['dome_copper'], subdivisions=2, name="HSBC_DomeSphere")
    add_cube((lx, ly + 11.2, lz + 2.0), (26, 0.3, 0.3), m['bund_floodlight'], name="HSBC_Flood")
    for fl in range(2, 6):
        add_cube((lx, ly + 11.05, lz + fl * 3.8), (22, 0.1, 1.4), m['heritage_win_lit'], name=f"HSBC_Win_{fl}")

def build_bank_of_china(col, m, loc=(-46, -48, 0)):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 16), (24, 22, 32), m['stone_classical'], name="BOC_Body")
    add_cube((lx, ly, lz + 33), (26, 24, 1.2), m['stone_dark'], name="BOC_EavesLower")
    add_cube((lx, ly + 1, lz + 38), (18, 16, 8.0), m['stone_classical'], name="BOC_UpperTower")
    add_cube((lx, ly + 1, lz + 43), (20, 18, 1.5), m['dome_copper'], name="BOC_EavesUpper")
    add_cube((lx, ly + 11.2, lz + 2.0), (22, 0.3, 0.3), m['bund_floodlight'], name="BOC_Flood")
    for fl in range(2, 9, 2):
        add_cube((lx, ly + 11.05, lz + fl * 3.4), (18, 0.1, 1.4), m['heritage_win_lit'], name=f"BOC_Win_{fl}")

def build_classical_bank_heritage(col, m, loc, name="ClassicalHeritage"):
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 12), (22, 20, 24), m['stone_classical'], name=f"{name}_Body")
    add_cube((lx, ly + 10.2, lz + 24.5), (20, 1.2, 1.6), m['stone_dark'], name=f"{name}_Cornice")
    for cx in [-6, 0, 6]:
        add_cyl((lx + cx, ly + 10.2, lz + 8), 0.7, 13, m['stone_dark'], vertices=12, name=f"{name}_Col_{cx}")
    add_cube((lx, ly + 10.4, lz + 1.5), (20, 0.3, 0.3), m['bund_floodlight'], name=f"{name}_Flood")
    for fl in range(2, 6):
        add_cube((lx, ly + 10.1, lz + fl * 3.6), (16, 0.1, 1.3), m['heritage_win_lit'], name=f"{name}_Win_{fl}")

def build_all_heritage_strip(col, m):
    build_classical_bank_heritage(col, m, (-74, -48, 0), name="Heritage_AsiaBldg")
    build_bank_of_china(col, m, (-46, -48, 0))
    build_peace_hotel(col, m, (-18, -48, 0))
    build_customs_house(col, m, (18, -48, 0))
    build_hsbc_building(col, m, (48, -48, 0))
    build_classical_bank_heritage(col, m, (76, -48, 0), name="Heritage_CharteredBank")

# ==================== LUJIAZUI MEGA SKYLINE ====================

def build_international_convention_center(col, m, loc=(-4, 130, 0)):
    """上海国际会议中心 (东方滨江大酒店) - 东方明珠正前方，双球玻璃球体与宏伟柱廊"""
    set_active_collection(col)
    lx, ly, lz = loc
    # Main hotel podium block
    add_cube((lx, ly, lz + 10.0), (44.0, 16.0, 20.0), m['stone_classical'], name="Convention_Podium")
    # Colonnade along the waterfront facade (Y front = ly - 8.0)
    for cx in range(-18, 20, 4):
        add_cyl((lx + cx, ly - 8.2, lz + 9.0), 0.55, 18.0, m['stone_dark'], vertices=12, name=f"Convention_Col_{cx}")
    add_cube((lx, ly - 8.2, lz + 18.5), (42.0, 1.2, 1.5), m['stone_dark'], name="Convention_Entablature")
    add_cube((lx, ly - 8.2, lz + 1.2), (42.0, 0.5, 0.4), m['bund_floodlight'], name="Convention_Floodlight")
    # Terraced upper roof
    add_cube((lx, ly, lz + 21.0), (36.0, 12.0, 3.0), m['stone_classical'], name="Convention_RoofDeck")

    # Iconic Dual Glowing Glass Spherical Globes (双玻璃球)
    # Globe West (left globe)
    add_sphere((lx - 16.0, ly - 1.0, lz + 22.0), 6.5, m['convention_globe'], subdivisions=3, name="Convention_Globe_West")
    add_torus((lx - 16.0, ly - 1.0, lz + 22.0), 6.7, 0.35, m['neon_cyan'], name="Convention_GlobeWest_Ring")
    add_cyl((lx - 16.0, ly - 1.0, lz + 14.0), 3.2, 8.0, m['pearl_concrete'], vertices=16, name="Convention_GlobeWest_Drum")

    # Globe East (right globe)
    add_sphere((lx + 16.0, ly - 1.0, lz + 22.0), 6.5, m['convention_globe'], subdivisions=3, name="Convention_Globe_East")
    add_torus((lx + 16.0, ly - 1.0, lz + 22.0), 6.7, 0.35, m['neon_cyan'], name="Convention_GlobeEast_Ring")
    add_cyl((lx + 16.0, ly - 1.0, lz + 14.0), 3.2, 8.0, m['pearl_concrete'], vertices=16, name="Convention_GlobeEast_Drum")

def build_oriental_pearl(col, m, loc=(-10, 148, 0)):
    set_active_collection(col)
    lx, ly, lz = loc
    for ang in [0, 120, 240]:
        rad = math.radians(ang)
        bx = lx + math.cos(rad) * 18.0
        by = ly + math.sin(rad) * 18.0
        add_cyl(((lx + bx)/2, (ly + by)/2, lz + 12.0), 1.8, 25.0, m['pearl_concrete'],
                rot=(math.sin(rad)*math.radians(-32), math.cos(rad)*math.radians(32), 0), name=f"Pearl_Leg_{ang}")

    add_cyl((lx, ly, lz + 12.0), 4.5, 24.0, m['pearl_concrete'], vertices=16, name="Pearl_BaseShaft")
    add_sphere((lx, ly, lz + 30.0), 10.0, m['pearl_concrete'], subdivisions=3, name="Pearl_LowerSphere")
    add_torus((lx, ly, lz + 30.0), 10.2, 0.75, m['pearl_pink_neon'], name="Pearl_LowerGlowBelt")
    add_torus((lx, ly, lz + 30.0), 10.3, 0.3, m['lujiazui_win_white'], name="Pearl_LowerLightBand")

    # 3 Central Columns with 5 intermediate mini-pearl spheres
    add_cyl((lx, ly, lz + 55.0), 4.2, 42.0, m['pearl_concrete'], vertices=16, name="Pearl_MidShafts")
    for pi, pz in enumerate([43.0, 49.0, 55.0, 61.0, 67.0]):
        add_sphere((lx, ly, lz + pz), 1.6, m['pearl_pink_neon'], subdivisions=2, name=f"Pearl_Mini_{pi}")

    add_sphere((lx, ly, lz + 78.0), 7.6, m['pearl_concrete'], subdivisions=3, name="Pearl_UpperSphere")
    add_torus((lx, ly, lz + 78.0), 7.8, 0.65, m['pearl_magenta_ring'], name="Pearl_UpperGlowBelt")

    add_cyl((lx, ly, lz + 92.0), 2.2, 20.0, m['pearl_concrete'], vertices=16, name="Pearl_SpaceNeck")
    add_sphere((lx, ly, lz + 104.0), 3.2, m['pearl_pink_neon'], subdivisions=2, name="Pearl_SpaceCabin")
    add_cone((lx, ly, lz + 118.0), 0.9, 0.12, 26.0, m['pearl_concrete'], vertices=8, name="Pearl_AntennaMast")
    add_sphere((lx, ly, lz + 131.5), 0.6, m['pearl_pink_neon'], subdivisions=2, name="Pearl_BeaconLight")

def build_shanghai_tower(col, m, loc=(28, 205, 0)):
    """上海中心大厦 (Shanghai Tower) - 632m中国最高楼，螺旋扭转外幕墙与标志性翡翠绿色对角激光光带"""
    set_active_collection(col)
    lx, ly, lz = loc
    total_tiers = 12
    tier_height = 13.5
    for t in range(total_tiers):
        tz = lz + t * tier_height + tier_height / 2
        r = 15.0 - t * 0.75
        rot_angle = math.radians(t * 12.0)
        add_cyl((lx, ly, tz), r, tier_height, m['shanghai_tower_glass'], vertices=8, rot=(0, 0, rot_angle), name=f"ShanghaiTower_T_{t}")
        # High-intensity Neon Ring at each tier boundary
        add_torus((lx, ly, tz + tier_height/2), r + 0.18, 0.35, m['neon_cyan'], name=f"ShanghaiTower_Ring_{t}")

        # Diagonal Emerald Green Laser Beam segment spiraling up the facade
        laser_ang = math.radians(-110 + t * 18.0)
        bx = lx + math.cos(laser_ang) * (r + 0.25)
        by = ly + math.sin(laser_ang) * (r + 0.25)
        add_cyl((bx, by, tz), 0.35, tier_height * 1.1, m['neon_emerald'],
                rot=(math.radians(15), math.radians(15), rot_angle), vertices=6, name=f"ShanghaiTower_Laser_{t}")

    add_cyl((lx, ly, lz + total_tiers * tier_height + 5.0), 4.5, 10.0, m['shanghai_tower_glass'], vertices=8, name="ShanghaiTower_Crown")
    add_cyl((lx, ly, lz + total_tiers * tier_height + 11.0), 0.35, 9.0, m['neon_emerald'], vertices=6, name="ShanghaiTower_Spire")

def build_swfc(col, m, loc=(16, 185, 0)):
    """环球金融中心 (SWFC '开瓶器') - 梯形风洞观光天桥与4边垂直霓虹光棱柱"""
    set_active_collection(col)
    lx, ly, lz = loc
    h = 135.0
    add_cube((lx, ly, lz + h * 0.42), (20.0, 20.0, h * 0.84), m['swfc_glass'], name="SWFC_BaseBody")
    # 4 Vertical Cyan Neon Edge Lines
    for dx, dy in [(-10.1, -10.1), (10.1, -10.1), (-10.1, 10.1), (10.1, 10.1)]:
        add_cube((lx + dx, ly + dy, lz + h * 0.42), (0.45, 0.45, h * 0.84), m['neon_cyan'], name=f"SWFC_Edge_{dx}_{dy}")

    # Upper body with trapezoidal aperture
    add_cube((lx - 7.0, ly, lz + 122.0), (4.5, 10.0, 16.0), m['swfc_glass'], name="SWFC_Pylon_L")
    add_cube((lx + 7.0, ly, lz + 122.0), (4.5, 10.0, 16.0), m['swfc_glass'], name="SWFC_Pylon_R")
    add_cube((lx - 9.1, ly, lz + 122.0), (0.45, 0.45, 16.0), m['neon_cyan'], name="SWFC_Aperture_L")
    add_cube((lx + 9.1, ly, lz + 122.0), (0.45, 0.45, 16.0), m['neon_cyan'], name="SWFC_Aperture_R")
    add_cube((lx, ly, lz + 114.5), (14.2, 0.45, 0.6), m['neon_cyan'], name="SWFC_Aperture_Bot")
    add_cube((lx, ly, lz + 130.5), (18.0, 9.0, 4.0), m['swfc_glass'], name="SWFC_Skybridge")
    add_cube((lx, ly, lz + 132.8), (18.2, 0.45, 0.6), m['neon_cyan'], name="SWFC_ApexGlow")

def build_jinmao_tower(col, m, loc=(40, 172, 0)):
    """金茂大厦 (Jin Mao Tower) - 11层中式密檐宝塔飞檐放射金光与莲花金顶"""
    set_active_collection(col)
    lx, ly, lz = loc
    h_step = 9.2
    for i in range(11):
        w = 18.0 - i * 1.1
        zh = lz + i * h_step + h_step / 2
        add_cube((lx, ly, zh), (w, w, h_step), m['jinmao_facade'], rot=(0,0,math.radians(45)), name=f"JinMao_Step_{i}")
        # Glowing Amber Pagoda Eave Brackets on every single tier!
        add_cube((lx, ly, zh + h_step/2), (w + 0.7, w + 0.7, 0.6), m['neon_amber'], rot=(0,0,math.radians(45)), name=f"JinMao_Glow_{i}")
    # Crown Spire & Lotus Crown
    add_cube((lx, ly, lz + 11 * h_step + 1.5), (5.0, 5.0, 2.5), m['neon_amber'], rot=(0,0,math.radians(45)), name="JinMao_Crown")
    add_cyl((lx, ly, lz + 11 * h_step + 7.5), 0.5, 12.0, m['pearl_concrete'], vertices=8, name="JinMao_Spire")
    add_cyl((lx, ly, lz + 11 * h_step + 14.0), 0.12, 6.0, m['neon_amber'], vertices=6, name="JinMao_SpireGlow")

def build_aurora_plaza(col, m, loc=(-34, 136, 0)):
    """震旦国际大厦 (Aurora Plaza) - 浦东江畔标志性金色大厦，配全套耀眼流光霓虹与世界闻名的巨幅'I❤️SH'大屏"""
    set_active_collection(col)
    lx, ly, lz = loc
    # Main tower body: front surface at ly - 7.0
    add_cube((lx, ly, lz + 30), (19, 14, 60), m['aurora_gold'], name="Aurora_Body")

    # Vibrant Vertical Neon Corner Ribbons running up both edges
    add_cube((lx - 9.6, ly - 7.25, lz + 30), (0.8, 0.8, 60.0), m['neon_red'], name="Aurora_NeonVertical_L")
    add_cube((lx + 9.6, ly - 7.25, lz + 30), (0.8, 0.8, 60.0), m['neon_amber'], name="Aurora_NeonVertical_R")
    add_cube((lx, ly - 7.35, lz + 50), (0.8, 0.8, 20.0), m['neon_magenta'], name="Aurora_NeonVertical_Center")

    # Giant iconic LED screen facing the Bund
    add_cube((lx, ly - 7.3, lz + 30), (16.5, 0.4, 32), m['aurora_screen'], name="Aurora_LED_Screen")

    # Neon Contour Frame around the Screen
    add_cube((lx, ly - 7.6, lz + 46.1), (17.2, 0.4, 0.8), m['neon_amber'], name="Aurora_ScreenNeon_Top")
    add_cube((lx, ly - 7.6, lz + 13.9), (17.2, 0.4, 0.8), m['neon_amber'], name="Aurora_ScreenNeon_Bot")
    add_cube((lx - 8.4, ly - 7.6, lz + 30.0), (0.7, 0.4, 33.0), m['neon_red'], name="Aurora_ScreenNeon_L")
    add_cube((lx + 8.4, ly - 7.6, lz + 30.0), (0.7, 0.4, 33.0), m['neon_red'], name="Aurora_ScreenNeon_R")

    # Iconic Glowing Red Heart "I ❤️ SH" Graphic on the LED Screen
    add_cube((lx, ly - 7.8, lz + 31.5), (4.8, 0.35, 4.8), m['neon_red'], rot=(0,0,math.radians(45)), name="Aurora_Heart_Center")
    add_sphere((lx - 1.7, ly - 7.8, lz + 33.9), 2.3, m['neon_red'], name="Aurora_Heart_LobeL")
    add_sphere((lx + 1.7, ly - 7.8, lz + 33.9), 2.3, m['neon_red'], name="Aurora_Heart_LobeR")
    # "I" bar
    add_cube((lx - 5.3, ly - 7.8, lz + 32.0), (1.2, 0.35, 7.0), m['lujiazui_win_white'], name="Aurora_Text_I")
    # "S" and "H"
    add_cube((lx + 4.9, ly - 7.8, lz + 34.4), (3.0, 0.35, 0.9), m['lujiazui_win_white'], name="Aurora_Text_S_Top")
    add_cube((lx + 4.9, ly - 7.8, lz + 32.0), (3.0, 0.35, 0.9), m['lujiazui_win_white'], name="Aurora_Text_S_Mid")
    add_cube((lx + 4.9, ly - 7.8, lz + 29.6), (3.0, 0.35, 0.9), m['lujiazui_win_white'], name="Aurora_Text_S_Bot")

    # Multi-Tiered Golden & Crimson Stepped Neon Crown
    add_cube((lx, ly, lz + 61.5), (17.0, 12.5, 3.0), m['aurora_gold'], name="Aurora_Crown")
    add_cube((lx, ly, lz + 63.2), (17.8, 13.2, 0.8), m['neon_amber'], name="Aurora_CrownGlow")
    add_cube((lx, ly, lz + 64.6), (13.5, 9.0, 0.6), m['neon_red'], name="Aurora_CrownTier2")
    add_cyl((lx, ly, lz + 67.5), 0.35, 6.0, m['neon_magenta'], name="Aurora_CrownSpire")

def build_citigroup_tower(col, m, loc=(54, 140, 0)):
    """花旗集团大厦 (Citigroup Tower) - 4边垂直霓虹边线、立面流光百叶瀑布、红白拱形Logo与暖金发光皇冠"""
    set_active_collection(col)
    lx, ly, lz = loc
    # Main body
    add_cube((lx, ly, lz + 30), (17, 13, 60), m['citi_blue'], name="Citi_Body")

    # 4 Vertical Cyber Neon Corner Pillars
    for dx, dy in [(-8.7, -6.7), (8.7, -6.7), (-8.7, 6.7), (8.7, 6.7)]:
        add_cube((lx + dx, ly + dy, lz + 30), (0.7, 0.7, 60.0), m['neon_cyan'], name=f"Citi_NeonPillar_{dx}_{dy}")

    # Crown top stage with warm golden glowing crown (as seen clearly in Image 2!)
    add_cube((lx, ly, lz + 61.0), (15.0, 11.5, 2.5), m['citi_blue'], name="Citi_Crown")
    add_cube((lx, ly, lz + 62.5), (15.8, 12.2, 1.0), m['neon_amber'], name="Citi_CrownHalo")
    add_cube((lx, ly, lz + 63.8), (12.0, 8.8, 0.8), m['neon_red'], name="Citi_CrownTopHalo")

    # Iconic Red Arc / Umbrella Logo facing The Bund
    add_torus((lx, ly - 7.0, lz + 54.0), 3.8, 0.65, m['neon_red'], rot=(math.radians(90), 0, 0), name="Citi_RedArc")
    add_cube((lx, ly - 7.0, lz + 51.5), (5.8, 0.4, 1.8), m['lujiazui_win_white'], name="Citi_Text_citi")

    # Sleek illuminated horizontal ribbons on facade (10 cascading tiers)
    for fl in range(2, 14, 2):
        add_cube((lx, ly - 6.85, fl * 4.3), (16.0, 0.4, 0.8), m['neon_cyan'], name=f"Citi_Ribbon_{fl}")

def build_ifc_twin_towers(col, m):
    """上海国际金融中心 (Shanghai IFC 双子塔) - 钻石切角全高垂直霓虹立柱与璀璨钻石皇冠"""
    set_active_collection(col)
    # Tower 1 (North Tower, 58F, height 108m)
    add_cube((-22, 172, 54), (16, 16, 108), m['swfc_glass'], rot=(0, 0, math.radians(15)), name="IFC_Tower1_Body")
    # 4 Vertical Diamond Neon Edge Struts
    for dx, dy in [(-8.1, -8.1), (8.1, -8.1), (-8.1, 8.1), (8.1, 8.1)]:
        rad = math.radians(15)
        rx = dx * math.cos(rad) - dy * math.sin(rad)
        ry = dx * math.sin(rad) + dy * math.cos(rad)
        add_cube((-22 + rx, 172 + ry, 54), (0.7, 0.7, 108.0), m['neon_purple'], name=f"IFC_T1_Neon_{dx}_{dy}")
    add_cone((-22, 172, 112), 7.5, 0.5, 8.0, m['swfc_glass'], vertices=4, rot=(0, 0, math.radians(15)), name="IFC_Tower1_DiamondPeak")
    add_cube((-22, 172, 116), (1.4, 1.4, 4.5), m['neon_magenta'], name="IFC_Tower1_Beacon")

    # Tower 2 (South Tower, 53F, height 96m)
    add_cube((6, 178, 48), (15, 15, 96), m['swfc_glass'], rot=(0, 0, math.radians(-15)), name="IFC_Tower2_Body")
    for dx, dy in [(-7.6, -7.6), (7.6, -7.6), (-7.6, 7.6), (7.6, 7.6)]:
        rad = math.radians(-15)
        rx = dx * math.cos(rad) - dy * math.sin(rad)
        ry = dx * math.sin(rad) + dy * math.cos(rad)
        add_cube((6 + rx, 178 + ry, 48), (0.7, 0.7, 96.0), m['neon_purple'], name=f"IFC_T2_Neon_{dx}_{dy}")
    add_cone((6, 178, 100), 7.0, 0.5, 8.0, m['swfc_glass'], vertices=4, rot=(0, 0, math.radians(-15)), name="IFC_Tower2_DiamondPeak")
    add_cube((6, 178, 104), (1.4, 1.4, 4.5), m['neon_magenta'], name="IFC_Tower2_Beacon")

def build_lujiazui_circular_skybridge(col, m, loc=(0, 148, 0)):
    """陆家嘴环形人行天桥 - 东方明珠脚下的标志性景观圆形天桥"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_torus((lx, ly, lz + 4.2), 22.0, 1.8, m['granite_deck'], name="Lujiazui_Skybridge_Deck")
    add_torus((lx, ly, lz + 5.6), 23.5, 0.25, m['neon_cyan'], name="Lujiazui_Skybridge_OuterGlow")
    add_torus((lx, ly, lz + 5.6), 20.5, 0.25, m['neon_cyan'], name="Lujiazui_Skybridge_InnerGlow")
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        px = lx + math.cos(rad) * 22.0
        py = ly + math.sin(rad) * 22.0
        add_cyl((px, py, lz + 2.1), 0.6, 4.2, m['pearl_concrete'], vertices=8, name=f"Skybridge_Pillar_{ang}")

def build_waibaidu_bridge(col, m, loc=(-84, 11, 0)):
    """外白渡桥 (Waibaidu Bridge) - 外滩北端跨苏州河的百年双孔驼峰式钢桁架结构名桥"""
    set_active_collection(col)
    lx, ly, lz = loc
    for span, dx in [("Span1", -8.0), ("Span2", 8.0)]:
        add_cube((lx + dx, ly, lz + 1.6), (15.0, 7.0, 0.4), m['granite_deck'], name=f"Waibaidu_{span}_Deck")
        for side, dy in [("North", -3.6), ("South", 3.6)]:
            add_cube((lx + dx, ly + dy, lz + 3.8), (14.0, 0.25, 0.4), m['neon_amber'], name=f"Waibaidu_{span}_{side}_Top")
            add_cube((lx + dx, ly + dy, lz + 1.8), (14.8, 0.25, 0.4), m['neon_amber'], name=f"Waibaidu_{span}_{side}_Bot")
            for step in range(-6, 7, 3):
                h = 3.6 - abs(step) * 0.25
                add_cyl((lx + dx + step, ly + dy, lz + 1.8 + h/2), 0.12, h, m['neon_amber'], name=f"Waibaidu_{span}_{side}_Strut_{step}")
    add_cube((lx, ly, lz + 0.8), (2.4, 8.5, 1.6), m['stone_classical'], name="Waibaidu_CenterPier")
    add_cube((lx - 16, ly, lz + 0.8), (2.4, 8.5, 1.6), m['stone_classical'], name="Waibaidu_WestPier")
    add_cube((lx + 16, ly, lz + 0.8), (2.4, 8.5, 1.6), m['stone_classical'], name="Waibaidu_EastPier")

def build_monument_to_heroes(col, m, loc=(-72, 14, 0)):
    """人民英雄纪念塔 - 外滩黄浦公园三枪矗立花岗岩纪念碑"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cyl((lx, ly, lz + 0.5), 8.0, 1.0, m['stone_classical'], vertices=16, name="Monument_Plaza")
    for ang in [0, 120, 240]:
        rad = math.radians(ang)
        px = lx + math.cos(rad) * 1.5
        py = ly + math.sin(rad) * 1.5
        add_cone((px, py, lz + 14), 1.5, 0.35, 26.0, m['stone_classical'], vertices=4, name=f"Monument_Pylon_{ang}")
        add_cube((px, py, lz + 27.5), (0.4, 0.4, 0.8), m['neon_amber'], name=f"Monument_Glow_{ang}")

def build_lujiazui_backdrop_skyscrapers(col, m):
    """陆家嘴背景摩天楼群 - 每栋大厦均配置霓虹楼顶皇冠带、立面垂直轮廓线与发光天线，包含香格里拉大酒店与中国银行大厦"""
    towers = [
        # (name, (x, y), (w, d, h), neon_mat, crown_type)
        ("ShangriLa", (-58, 162), (22, 20, 82), m['neon_amber'], "pyramid"),
        ("AuroraAnnex", (-48, 178), (20, 18, 92), m['neon_purple'], "flat"),
        ("BOC_Pudong", (72, 160), (22, 20, 86), m['neon_amber'], "stepped"),
        ("Lujiazui_North1", (-20, 215), (24, 20, 105), m['neon_cyan'], "flat"),
        ("Lujiazui_North2", (2, 220), (26, 22, 115), m['neon_purple'], "spire"),
        ("Lujiazui_East1", (46, 210), (22, 20, 100), m['neon_emerald'], "flat"),
        ("Lujiazui_East2", (92, 175), (20, 18, 72), m['neon_magenta'], "flat"),
        ("Lujiazui_West1", (-82, 172), (18, 16, 68), m['neon_red'], "flat"),
    ]
    for i, (t_name, (tx, ty), (w, d, h), neon_mat, crown_type) in enumerate(towers):
        add_cube((tx, ty, h/2), (w, d, h), m['swfc_glass'], name=f"Pudong_Tower_{t_name}")
        # Glowing Neon Rooftop Crown
        if crown_type == "pyramid":
            add_cone((tx, ty, h + 5.0), w * 0.45, 0.2, 10.0, m['peace_copper'], vertices=4, rot=(0,0,math.radians(45)), name=f"Pudong_Crown_{t_name}")
            add_cube((tx, ty, h + 0.4), (w + 0.6, d + 0.6, 0.8), neon_mat, name=f"Pudong_CrownHalo_{t_name}")
        elif crown_type == "stepped":
            add_cube((tx, ty, h + 2.0), (w * 0.7, d * 0.7, 4.0), m['stone_classical'], name=f"Pudong_Crown_{t_name}")
            add_cube((tx, ty, h + 4.5), (w * 0.75, d * 0.75, 0.8), neon_mat, name=f"Pudong_CrownHalo_{t_name}")
        else:
            add_cube((tx, ty, h + 0.4), (w + 0.8, d + 0.8, 0.9), neon_mat, name=f"Pudong_Crown_{t_name}")

        # Glowing Rooftop Antenna / Mast
        add_cyl((tx, ty, h + 6.0), 0.35, 11.0, neon_mat, name=f"Pudong_Antenna_{t_name}")
        # Vertical Neon Corner Edge Lines
        add_cube((tx - w/2, ty - d/2, h/2), (0.45, 0.45, h), neon_mat, name=f"Pudong_EdgeL_{t_name}")
        add_cube((tx + w/2, ty - d/2, h/2), (0.45, 0.45, h), neon_mat, name=f"Pudong_EdgeR_{t_name}")

        for fl in range(2, int(h/4), 2):
            add_cube((tx, ty - d*0.505, fl * 4.0), (w * 0.78, 0.12, 1.5), m['lujiazui_win_cyan'], name=f"Pudong_Win_{t_name}_{fl}")

# ==================== 5 CRUISE SHIPS CLUSTERED IN FAIRWAY ====================

def build_luxury_cruise_flagship(col, m, loc=(24, 62, -0.6), rot_z=math.radians(14), name="Cruise_Flagship"):
    """1. 浦江豪华双层游览旗舰轮 (中景航道右侧，比例精巧逼真)"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.25), (12, 3.4, 0.5), m['boat_red'], rot=(0,0,rot_z), name=f"{name}_Waterline")
    add_cube((lx, ly, lz + 0.65), (11.8, 3.2, 0.55), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_MainHull")
    add_cube((lx, ly, lz + 0.95), (11.9, 3.25, 0.1), m['boat_blue'], rot=(0,0,rot_z), name=f"{name}_Stripe")
    bx = lx - math.cos(rot_z) * 6.5
    by = ly - math.sin(rot_z) * 6.5
    add_cone((bx, by, lz + 0.65), 1.6, 0.1, 2.2, m['boat_hull'], vertices=6, rot=(0, math.radians(90), rot_z), name=f"{name}_Bow")
    # Saloon Cabin Tier 1 with luminous windows
    add_cube((lx + math.cos(rot_z)*0.7, ly + math.sin(rot_z)*0.7, lz + 1.3), (8.2, 2.7, 0.7), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Cabin1")
    add_cube((lx + math.cos(rot_z)*0.7, ly + math.sin(rot_z)*0.7, lz + 1.3), (8.3, 2.75, 0.4), m['boat_window'], rot=(0,0,rot_z), name=f"{name}_CabinWin1")
    # Sightseeing Deck Tier 2
    add_cube((lx + math.cos(rot_z)*1.4, ly + math.sin(rot_z)*1.4, lz + 1.9), (5.5, 2.1, 0.6), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Cabin2")
    add_cube((lx + math.cos(rot_z)*1.4, ly + math.sin(rot_z)*1.4, lz + 1.9), (5.6, 2.15, 0.35), m['boat_window'], rot=(0,0,rot_z), name=f"{name}_CabinWin2")
    add_cyl((lx + math.cos(rot_z)*2.8, ly + math.sin(rot_z)*2.8, lz + 2.5), 0.25, 0.8, m['boat_red'], rot=(0,math.radians(14),rot_z), name=f"{name}_Funnel")
    add_cyl((lx - math.cos(rot_z)*1.4, ly - math.sin(rot_z)*1.4, lz + 2.4), 0.05, 1.0, m['cast_iron'], rot=(0,0,rot_z), name=f"{name}_Mast")

def build_antique_dragon_boat(col, m, loc=(-26, 52, -0.6), rot_z=math.radians(-10), name="Cruise_Antique"):
    """2. 浦江古典画舫游船 (中景航道左侧，金顶飞檐挂红灯笼)"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.25), (10.5, 3.2, 0.5), m['boat_red'], rot=(0,0,rot_z), name=f"{name}_Hull")
    add_cube((lx, ly, lz + 0.55), (10.2, 3.0, 0.15), m['boat_deck'], rot=(0,0,rot_z), name=f"{name}_Deck")
    add_cube((lx, ly, lz + 1.2), (7.0, 2.4, 0.9), m['stone_classical'], rot=(0,0,rot_z), name=f"{name}_PavilionBody")
    add_cube((lx, ly, lz + 1.2), (7.1, 2.45, 0.5), m['boat_window'], rot=(0,0,rot_z), name=f"{name}_PavilionWin")
    add_cube((lx, ly, lz + 1.7), (8.0, 3.1, 0.2), m['aurora_gold'], rot=(0,0,rot_z), name=f"{name}_EavesLower")
    add_cube((lx, ly, lz + 2.1), (5.0, 2.0, 0.6), m['stone_classical'], rot=(0,0,rot_z), name=f"{name}_UpperTier")
    add_cube((lx, ly, lz + 2.5), (5.8, 2.6, 0.22), m['aurora_gold'], rot=(0,0,rot_z), name=f"{name}_EavesUpper")
    for li in [-2.8, 0, 2.8]:
        add_sphere((lx + li * math.cos(rot_z), ly + li * math.sin(rot_z) - 1.3, lz + 1.55), 0.18, m['lantern_red'], name=f"{name}_Lantern_{li}")

def build_modern_catamaran(col, m, loc=(-6, 78, -0.6), rot_z=math.radians(16), name="Cruise_Catamaran"):
    """3. 高速双体快艇 (中远景航道)"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.22), (8.5, 2.8, 0.4), m['boat_blue'], rot=(0,0,rot_z), name=f"{name}_Hull")
    add_cube((lx, ly, lz + 0.72), (7.0, 2.3, 0.6), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Cabin")
    add_cube((lx, ly, lz + 0.72), (7.1, 2.35, 0.38), m['lujiazui_win_cyan'], rot=(0,0,rot_z), name=f"{name}_Win")

def build_shanghai_ferry(col, m, loc=(38, 88, -0.6), rot_z=math.radians(-16), name="Cruise_Ferry"):
    """4. 经典复古市轮渡 (远景航道偏右)"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.25), (10.0, 3.4, 0.5), m['boat_red'], rot=(0,0,rot_z), name=f"{name}_Hull")
    add_cube((lx, ly, lz + 0.65), (9.6, 3.2, 0.4), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Deck")
    add_cube((lx, ly, lz + 1.15), (7.2, 2.6, 0.75), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Cabin")
    add_cube((lx, ly, lz + 1.15), (7.3, 2.65, 0.45), m['boat_window'], rot=(0,0,rot_z), name=f"{name}_Win")
    add_cyl((lx, ly, lz + 1.75), 0.25, 0.7, m['boat_red'], rot=(0,0,rot_z), name=f"{name}_Chimney")

def build_pilot_boat(col, m, loc=(-38, 70, -0.6), rot_z=math.radians(10), name="Cruise_Pilot"):
    """5. 水上巡逻引航艇 (中景航道偏左)"""
    set_active_collection(col)
    lx, ly, lz = loc
    add_cube((lx, ly, lz + 0.2), (6.5, 2.1, 0.35), m['boat_blue'], rot=(0,0,rot_z), name=f"{name}_Hull")
    add_cube((lx, ly, lz + 0.58), (4.5, 1.7, 0.5), m['boat_hull'], rot=(0,0,rot_z), name=f"{name}_Cabin")
    add_cube((lx, ly, lz + 0.58), (4.6, 1.75, 0.3), m['lujiazui_win_white'], rot=(0,0,rot_z), name=f"{name}_Win")
    add_sphere((lx, ly, lz + 0.95), 0.14, m['lamp_bulb'], name=f"{name}_Light")

# ==================== SCENE COMPILATION ====================

def setup_lighting_and_camera(col):
    set_active_collection(col)
    moon_data = bpy.data.lights.new(name="MoonSkyLight", type='SUN')
    moon_data.energy = 2.5
    moon_data.color = (0.55, 0.72, 0.98)
    moon_obj = bpy.data.objects.new(name="MoonSkyLight", object_data=moon_data)
    moon_obj.location = (0, 0, 80)
    moon_obj.rotation_euler = (math.radians(55), math.radians(20), math.radians(-40))
    col.objects.link(moon_obj)

    bund_flood = bpy.data.lights.new(name="BundFloodSun", type='SUN')
    bund_flood.energy = 3.4
    bund_flood.color = (1.0, 0.85, 0.45)
    bund_flood_obj = bpy.data.objects.new(name="BundFloodSun", object_data=bund_flood)
    bund_flood_obj.location = (0, -35, 30)
    bund_flood_obj.rotation_euler = (math.radians(-65), 0, 0)
    col.objects.link(bund_flood_obj)

    cam_data = bpy.data.cameras.new(name="MainCineCamera_TheBund")
    cam_data.lens = 20
    cam_data.clip_end = 2000
    cam_obj = bpy.data.objects.new(name="MainCineCamera_TheBund", object_data=cam_data)
    cam_obj.location = (0, 0.0, 3.2)
    cam_obj.rotation_euler = (math.radians(95), 0, 0)
    col.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("BundNightWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = (0.02, 0.04, 0.08, 1.0)
        bg_node.inputs["Strength"].default_value = 1.0

def build_all():
    print(">>> 1. Initializing clean workspace for Ultra-Photorealistic Shanghai Bund...")
    reset_blender()

    col_river = get_or_create_collection("01_Huangpu_River")
    col_bund = get_or_create_collection("02_Bund_Promenade_and_Plaza")
    col_heritage = get_or_create_collection("03_Historic_Heritage_Buildings")
    col_skyline = get_or_create_collection("04_Lujiazui_Skyline_Towers")
    col_boats = get_or_create_collection("05_River_Cruise_Boats")
    col_props = get_or_create_collection("06_Street_Props_Lamps_Benches")
    col_studio = get_or_create_collection("07_Lighting_and_Cameras")

    print(">>> 2. Initializing materials...")
    m = init_materials()

    print(">>> 3. Building River Channel bed and seawalls...")
    build_river_channel(col_river, m)

    print(">>> 4. Building Elevated Bund Promenade & East Zhongshan No.1 Road...")
    build_bund_promenade_and_street(col_bund, m)

    print(">>> 5. Building 8 Historic Heritage Buildings, Waibaidu Bridge & Monument...")
    build_all_heritage_strip(col_heritage, m)
    build_waibaidu_bridge(col_heritage, m, loc=(-84, 11, 0))
    build_monument_to_heroes(col_heritage, m, loc=(-72, 14, 0))

    print(">>> 6. Building Prominent Lujiazui Skyline (Oriental Pearl, Convention Center, Tower, SWFC, Jin Mao, Aurora, Citi, IFC, Skybridge)...")
    build_oriental_pearl(col_skyline, m, loc=(-10, 148, 0))
    build_international_convention_center(col_skyline, m, loc=(-4, 130, 0))
    build_lujiazui_circular_skybridge(col_skyline, m, loc=(-10, 146, 0))
    build_shanghai_tower(col_skyline, m, loc=(28, 205, 0))
    build_swfc(col_skyline, m, loc=(16, 185, 0))
    build_jinmao_tower(col_skyline, m, loc=(40, 172, 0))
    build_aurora_plaza(col_skyline, m, loc=(-34, 136, 0))
    build_citigroup_tower(col_skyline, m, loc=(54, 140, 0))
    build_ifc_twin_towers(col_skyline, m)
    build_lujiazui_backdrop_skyscrapers(col_skyline, m)

    print(">>> 7. Deploying 5 Cruise Ships properly spaced along Huangpu fairway...")
    build_luxury_cruise_flagship(col_boats, m, loc=(24, 62, -0.6), rot_z=math.radians(14))
    build_antique_dragon_boat(col_boats, m, loc=(-26, 52, -0.6), rot_z=math.radians(-10))
    build_modern_catamaran(col_boats, m, loc=(-6, 78, -0.6), rot_z=math.radians(16))
    build_shanghai_ferry(col_boats, m, loc=(38, 88, -0.6), rot_z=math.radians(-16))
    build_pilot_boat(col_boats, m, loc=(-38, 70, -0.6), rot_z=math.radians(10))

    print(">>> 8. Installing Victorian Street Lamps & Landscape...")
    for lx in range(-80, 85, 14):
        # Keep the central observation corridor (X: -16 to +16) COMPLETELY clear of any camera obstructions
        if abs(lx) > 16:
            build_bund_lamp(col_props, m, (lx, 10.2, 1.2), name=f"BundLamp_{lx}")
        if lx % 28 != 0 and abs(lx) > 12:
            build_bund_bench(col_props, m, (lx + 6, 9.6, 1.2), rot_z=math.radians(180), name=f"BundBench_{lx}")

    for tx in range(-75, 80, 12):
        scale = 0.85 + (abs(tx) % 3) * 0.1
        add_cyl((tx, -15.5, 0.4 + 1.0 * scale), 0.18 * scale, 2.0 * scale, m['tree_trunk'], vertices=8, name=f"TreeTrunk_{tx}")
        add_sphere((tx, -15.5, 0.4 + 2.3 * scale), 1.2 * scale, m['tree_leaf'], subdivisions=2, name=f"TreeCanopy_{tx}")

    print(">>> 9. Setting Up Cinema Camera & Night Sky Floodlighting...")
    setup_lighting_and_camera(col_studio)

    print(f">>> 10. SAVING NATIVE BLENDER PROJECT: {BLEND_OUT}")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    env_glb = os.path.join(WEB_ASSETS, "plaza_environment.glb")
    print(f">>> 11. EXPORTING BUND ENVIRONMENT GLB: {env_glb}")
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=env_glb,
        export_format='GLB',
        use_selection=True,
        export_apply=True
    )
    print("=== ULTRA-PHOTOREALISTIC SHANGHAI BUND EXPORT COMPLETED ===")

if __name__ == '__main__':
    build_all()
