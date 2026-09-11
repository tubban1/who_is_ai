"""WHO IS AI? High Quality Blender 5.2 Asset Generator
Uses Blender Python API (bpy) to model stylized low-poly PBR assets and export GLB.
"""
import bpy
import math
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT = os.path.join(ROOT, 'apps', 'web', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_mat(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = (*color[:3], 1.0)
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
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

def add_cube(loc, scale, mat=None, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = scale
    if mat: apply_mat(o, mat)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o

def add_cyl(loc, r, depth, mat=None, rot=(0,0,0), vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    if mat: apply_mat(o, mat)
    return o

def add_sphere(loc, r, mat=None, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=r, location=loc)
    o = bpy.context.object
    if mat: apply_mat(o, mat)
    return o

def add_torus(loc, r_major, r_minor, mat=None, rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, major_radius=r_major, minor_radius=r_minor)
    o = bpy.context.object
    if mat: apply_mat(o, mat)
    return o

def export_glb(name):
    filepath = os.path.join(OUT, f"{name}.glb")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True
    )
    print(f"--> Exported {name}.glb to {filepath}")

# 1. AVATAR (Stylized Character)
def build_avatar():
    clear_scene()
    m_skin = create_mat("Skin", (0.96, 0.80, 0.69), roughness=0.6)
    m_hair = create_mat("Hair", (0.16, 0.14, 0.20), roughness=0.7)
    m_coat = create_mat("Coat", (0.14, 0.35, 0.48), roughness=0.45)
    m_pants = create_mat("Pants", (0.12, 0.15, 0.20), roughness=0.6)
    m_shoes = create_mat("Shoes", (0.88, 0.90, 0.94), roughness=0.4)
    m_headphones = create_mat("Headphones", (0.85, 0.25, 0.35), metallic=0.3, roughness=0.3)
    m_glow = create_mat("BadgeGlow", (0.4, 0.95, 0.85), roughness=0.2, emission=(0.4, 0.95, 0.85), emission_strength=2.5)

    add_cube((-0.18, 0.05, 0.1), (0.12, 0.22, 0.1), m_shoes)
    add_cube((0.18, 0.05, 0.1), (0.12, 0.22, 0.1), m_shoes)

    add_cyl((-0.18, 0, 0.52), 0.11, 0.75, m_pants)
    add_cyl((0.18, 0, 0.52), 0.11, 0.75, m_pants)

    add_cube((0, 0, 1.15), (0.34, 0.24, 0.45), m_coat)
    add_cube((0, 0.24, 1.15), (0.04, 0.02, 0.44), m_glow)

    add_cyl((-0.42, 0, 1.12), 0.09, 0.65, m_coat, rot=(0, math.radians(12), 0))
    add_cyl((0.42, 0, 1.12), 0.09, 0.65, m_coat, rot=(0, math.radians(-12), 0))
    add_sphere((-0.48, 0, 0.78), 0.09, m_skin)
    add_sphere((0.48, 0, 0.78), 0.09, m_skin)

    add_cube((0, -0.28, 1.20), (0.24, 0.12, 0.30), m_hair)

    add_sphere((0, 0, 1.82), 0.30, m_skin, subdivisions=3)

    add_sphere((0, -0.05, 1.95), 0.31, m_hair, subdivisions=3)
    add_cube((0, 0.15, 2.02), (0.28, 0.16, 0.09), m_hair)

    m_eye = create_mat("Eye", (0.05, 0.05, 0.08), roughness=0.2)
    add_sphere((-0.11, 0.26, 1.82), 0.04, m_eye)
    add_sphere((0.11, 0.26, 1.82), 0.04, m_eye)

    add_torus((0, 0, 1.88), 0.32, 0.04, m_headphones, rot=(math.radians(90), 0, 0))
    add_cyl((-0.32, 0, 1.82), 0.12, 0.08, m_headphones, rot=(0, math.radians(90), 0))
    add_cyl((0.32, 0, 1.82), 0.12, 0.08, m_headphones, rot=(0, math.radians(90), 0))

    export_glb('avatar')

# 2. FOUNTAIN
def build_fountain():
    clear_scene()
    m_marble = create_mat("Marble", (0.82, 0.85, 0.88), metallic=0.05, roughness=0.3)
    m_granite = create_mat("Granite", (0.35, 0.38, 0.42), metallic=0.1, roughness=0.5)
    m_water = create_mat("Water", (0.15, 0.65, 0.85), roughness=0.05, emission=(0.1, 0.4, 0.6), emission_strength=0.8)
    m_gold = create_mat("GoldSpray", (0.95, 0.78, 0.35), metallic=0.85, roughness=0.2)

    add_cyl((0, 0, 0.2), 3.2, 0.4, m_granite, vertices=8)
    add_cyl((0, 0, 0.42), 3.0, 0.2, m_marble, vertices=8)
    add_cyl((0, 0, 0.44), 2.85, 0.08, m_water, vertices=24)

    add_cyl((0, 0, 0.9), 0.8, 0.9, m_granite, vertices=16)

    add_cyl((0, 0, 1.4), 1.6, 0.25, m_marble, vertices=24)
    add_cyl((0, 0, 1.48), 1.48, 0.08, m_water, vertices=24)

    add_cyl((0, 0, 1.9), 0.45, 0.8, m_granite, vertices=16)

    add_cyl((0, 0, 2.35), 0.9, 0.20, m_marble, vertices=24)
    add_cyl((0, 0, 2.42), 0.82, 0.06, m_water, vertices=24)

    add_cyl((0, 0, 2.65), 0.15, 0.4, m_gold, vertices=12)
    add_sphere((0, 0, 2.9), 0.25, m_gold, subdivisions=2)

    add_sphere((0, 0, 3.15), 0.18, m_water, subdivisions=2)
    add_sphere((0.2, 0.2, 2.7), 0.12, m_water, subdivisions=1)
    add_sphere((-0.2, -0.2, 2.7), 0.12, m_water, subdivisions=1)

    export_glb('fountain')

# 3. TREE
def build_tree():
    clear_scene()
    m_bark = create_mat("Bark", (0.28, 0.18, 0.12), roughness=0.8)
    m_leaf1 = create_mat("LeavesDark", (0.10, 0.38, 0.24), roughness=0.6)
    m_leaf2 = create_mat("LeavesMid", (0.16, 0.52, 0.32), roughness=0.55)
    m_leaf3 = create_mat("LeavesLight", (0.28, 0.65, 0.38), roughness=0.5)

    add_cyl((0, 0, 0.4), 0.38, 0.8, m_bark, vertices=8)
    add_cyl((0, 0, 1.4), 0.28, 1.3, m_bark, vertices=8)
    add_cyl((-0.2, 0, 2.2), 0.16, 0.9, m_bark, rot=(0, math.radians(-25), 0), vertices=6)
    add_cyl((0.25, 0.1, 2.15), 0.15, 0.8, m_bark, rot=(math.radians(15), math.radians(22), 0), vertices=6)

    add_sphere((0, 0, 2.8), 1.45, m_leaf1, subdivisions=2)
    add_sphere((0.85, 0.2, 2.7), 1.05, m_leaf1, subdivisions=2)
    add_sphere((-0.75, -0.3, 2.65), 0.95, m_leaf1, subdivisions=2)

    add_sphere((0.15, -0.1, 3.7), 1.3, m_leaf2, subdivisions=2)
    add_sphere((-0.6, 0.4, 3.5), 0.95, m_leaf2, subdivisions=2)
    add_sphere((0.5, -0.5, 3.4), 0.9, m_leaf2, subdivisions=2)

    add_sphere((0, 0, 4.6), 1.0, m_leaf3, subdivisions=2)

    export_glb('tree')

# 4. LAMP
def build_lamp():
    clear_scene()
    m_iron = create_mat("CastIron", (0.12, 0.14, 0.18), metallic=0.8, roughness=0.35)
    m_glass = create_mat("GlassGlow", (0.95, 0.85, 0.5), roughness=0.15, emission=(1.0, 0.82, 0.45), emission_strength=4.0)
    m_trim = create_mat("GoldTrim", (0.85, 0.70, 0.35), metallic=0.9, roughness=0.25)

    add_cyl((0, 0, 0.15), 0.42, 0.3, m_iron, vertices=8)
    add_cyl((0, 0, 0.5), 0.26, 0.4, m_iron, vertices=12)

    add_cyl((0, 0, 2.1), 0.11, 2.8, m_iron, vertices=16)

    add_torus((0, 0, 1.2), 0.14, 0.03, m_trim)
    add_torus((0, 0, 2.6), 0.13, 0.03, m_trim)

    add_cyl((0, 0, 3.55), 0.18, 0.2, m_trim, vertices=8)

    add_cyl((0, 0, 3.7), 0.28, 0.1, m_iron, vertices=6)
    add_cyl((0, 0, 4.05), 0.24, 0.6, m_glass, vertices=6)
    add_cyl((0, 0, 4.42), 0.35, 0.15, m_iron, vertices=6)
    add_sphere((0, 0, 4.6), 0.1, m_trim)

    export_glb('lamp')

# 5. BENCH
def build_bench():
    clear_scene()
    m_wood = create_mat("PolishedWood", (0.55, 0.30, 0.15), roughness=0.4)
    m_iron = create_mat("BenchIron", (0.12, 0.14, 0.16), metallic=0.7, roughness=0.4)

    for x in [-1.1, 1.1]:
        add_cube((x, -0.22, 0.25), (0.06, 0.08, 0.5), m_iron)
        add_cube((x, 0.22, 0.25), (0.06, 0.08, 0.5), m_iron)
        add_cube((x, 0, 0.65), (0.07, 0.58, 0.08), m_iron)
        add_cube((x, 0.25, 0.75), (0.06, 0.08, 0.7), m_iron, rot=(math.radians(-12), 0, 0))

    for i in range(4):
        y = -0.22 + i * 0.14
        add_cube((0, y, 0.52), (2.4, 0.10, 0.04), m_wood)

    for i in range(3):
        z = 0.72 + i * 0.15
        y = 0.22 + i * 0.03
        add_cube((0, y, z), (2.4, 0.04, 0.11), m_wood, rot=(math.radians(-12), 0, 0))

    export_glb('bench')

# 6. PAVILION
def build_pavilion():
    clear_scene()
    m_platform = create_mat("Deck", (0.25, 0.28, 0.32), roughness=0.6)
    m_pillar = create_mat("MetalPillar", (0.14, 0.18, 0.22), metallic=0.85, roughness=0.3)
    m_roof = create_mat("RoofTrim", (0.18, 0.45, 0.55), metallic=0.5, roughness=0.35)
    m_glass = create_mat("Skylight", (0.45, 0.85, 0.95), metallic=0.2, roughness=0.1, emission=(0.1, 0.3, 0.4), emission_strength=0.5)

    add_cube((0, 0, 0.1), (5.6, 5.6, 0.2), m_platform)
    add_cube((0, 0, 0.25), (5.0, 5.0, 0.1), m_platform)

    corners = [(-2.2, -2.2), (2.2, -2.2), (-2.2, 2.2), (2.2, 2.2)]
    for cx, cy in corners:
        add_cyl((cx, cy, 1.8), 0.14, 3.0, m_pillar, vertices=12)
        add_cube((cx, cy, 0.38), (0.35, 0.35, 0.15), m_pillar)

    add_cube((0, -2.2, 3.35), (4.6, 0.2, 0.25), m_pillar)
    add_cube((0, 2.2, 3.35), (4.6, 0.2, 0.25), m_pillar)
    add_cube((-2.2, 0, 3.35), (0.2, 4.6, 0.25), m_pillar)
    add_cube((2.2, 0, 3.35), (0.2, 4.6, 0.25), m_pillar)

    add_cube((0, 0, 3.6), (5.8, 5.8, 0.22), m_roof)
    add_cube((0, 0, 3.75), (3.8, 3.8, 0.08), m_glass)

    export_glb('pavilion')

# 7. SCULPTURE
def build_sculpture():
    clear_scene()
    m_pedestal = create_mat("PedestalGranite", (0.15, 0.16, 0.18), metallic=0.1, roughness=0.4)
    m_gold = create_mat("ChampagneGold", (0.92, 0.75, 0.35), metallic=0.92, roughness=0.18)
    m_core = create_mat("CyberCore", (0.3, 0.9, 0.8), roughness=0.1, emission=(0.3, 0.9, 0.8), emission_strength=3.0)

    add_cube((0, 0, 0.2), (1.4, 1.4, 0.4), m_pedestal)
    add_cube((0, 0, 0.7), (1.0, 1.0, 0.6), m_pedestal)

    add_torus((0, 0, 2.2), 0.95, 0.12, m_gold, rot=(math.radians(35), math.radians(25), math.radians(15)))
    add_torus((0, 0, 2.3), 0.80, 0.10, m_gold, rot=(math.radians(-40), math.radians(50), math.radians(70)))

    add_sphere((0, 0, 2.25), 0.28, m_core, subdivisions=3)

    export_glb('sculpture')

# 8. KIOSK
def build_kiosk():
    clear_scene()
    m_body = create_mat("KioskBody", (0.16, 0.32, 0.28), roughness=0.5)
    m_counter = create_mat("CounterWood", (0.65, 0.42, 0.22), roughness=0.4)
    m_canopy_w = create_mat("CanopyWhite", (0.92, 0.92, 0.94), roughness=0.6)
    m_canopy_r = create_mat("CanopyOrange", (0.88, 0.32, 0.18), roughness=0.5)
    m_interior = create_mat("InteriorWarm", (0.95, 0.85, 0.6), emission=(0.95, 0.85, 0.6), emission_strength=1.5)

    add_cube((0, 0, 1.1), (3.0, 2.2, 2.2), m_body)

    add_cube((0, 1.12, 1.3), (2.2, 0.1, 0.9), m_interior)
    add_cube((0, 1.25, 0.9), (2.4, 0.3, 0.08), m_counter)

    add_cube((-1.52, 0, 1.2), (0.04, 0.8, 1.1), m_counter)

    add_cube((0, 0, 2.25), (3.4, 2.6, 0.16), m_body)

    for i in range(8):
        x = -1.2 + i * 0.34
        mat = m_canopy_r if i % 2 == 0 else m_canopy_w
        add_cube((x, 1.5, 2.15 - i*0.01), (0.32, 0.8, 0.06), mat, rot=(math.radians(-18), 0, 0))

    export_glb('kiosk')

def main():
    print("=== STARTING BLENDER ASSET GENERATION ===")
    build_avatar()
    build_fountain()
    build_tree()
    build_lamp()
    build_bench()
    build_pavilion()
    build_sculpture()
    build_kiosk()
    print("=== COMPLETED ALL 8 HIGH-QUALITY ASSETS ===")

if __name__ == '__main__':
    main()
