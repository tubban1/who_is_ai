"""Original Blender assets for the web client. No external textures or add-ons.

Run: Blender --background --python assets/blender/build_realism_pass.py
The original Bund project remains the source; outputs are separate, reproducible files.
Blender -Y is the character's front, exported as glTF +Z. Units are metres.
"""
from pathlib import Path
import math
import re
import sys
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/assets'
ART = ROOT / 'assets/blender'
TAU = math.tau


def material(name, color, roughness=.65, metal=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return mat


def image_data(name, rgb, noncolor=False):
    h, w = rgb.shape[:2]
    image = bpy.data.images.new(name, width=w, height=h, alpha=False)
    if noncolor:
        image.colorspace_settings.name = 'Non-Color'
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[:, :, :3] = np.clip(rgb, 0, 1)
    image.pixels.foreach_set(rgba.ravel())
    image.pack()
    return image


def texture(mat, image, socket):
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = image
    node.interpolation = 'Linear'
    mat.node_tree.links.new(node.outputs['Color'], mat.node_tree.nodes.get('Principled BSDF').inputs[socket])


def surface_maps(mat, height, roughness):
    dy, dx = np.gradient(height)
    normal = np.stack((-dx * 6, -dy * 6, np.ones_like(dx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    img = image_data(mat.name + '_normal', normal * .5 + .5, True)
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = img
    bump = mat.node_tree.nodes.new('ShaderNodeNormalMap')
    mat.node_tree.links.new(node.outputs['Color'], bump.inputs['Color'])
    mat.node_tree.links.new(bump.outputs['Normal'], mat.node_tree.nodes.get('Principled BSDF').inputs['Normal'])
    texture(mat, image_data(mat.name + '_roughness', np.repeat(roughness[:, :, None], 3, axis=2), True), 'Roughness')


def group(name, loc=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = loc
    return obj


def finish(obj, mat, parent=None):
    obj.data.materials.append(mat)
    obj.parent = parent
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def ellipsoid(name, loc, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, parent)


def box(name, loc, size, mat, parent=None, bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new('Soft manufactured edges', 'BEVEL')
    mod.width = bevel
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    finish(obj, mat, parent)
    return obj


def loft(name, rings, mat, parent=None, segments=32, subdiv=1):
    # Cross sections: height, half width, half depth, depth offset.
    verts, faces = [], []
    for z, width, depth, offset in rings:
        for j in range(segments):
            angle = j * TAU / segments
            verts.append((width * math.cos(angle), offset + depth * math.sin(angle), z))
    for i in range(len(rings) - 1):
        for j in range(segments):
            a = i * segments + j
            b = i * segments + (j + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(rings) - 1) * segments + j for j in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, mat, parent)
    uv = mesh.uv_layers.new()
    for poly in mesh.polygons:
        for loop_id in poly.loop_indices:
            index = mesh.loops[loop_id].vertex_index
            uv.data[loop_id].uv = ((index % segments) / segments, (index // segments) / (len(rings) - 1))
    if subdiv:
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new('Tailored surface', 'SUBSURF')
        mod.levels = subdiv
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def line(name, points, radius, mat, parent=None):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return finish(obj, mat, parent)


def merge_parts():
    # Share geometry in the browser and limit each articulated part to its materials.
    parents = [o for o in bpy.context.scene.objects if o.type == 'EMPTY']
    for parent in parents:
        meshes = [o for o in parent.children if o.type == 'MESH']
        if not meshes:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        bpy.context.object.name = parent.name + '_Surface'


def export(path):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in {'MESH', 'EMPTY'}:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_apply=True)


def studio():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.world = bpy.data.worlds.new('Studio atmosphere')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.12, .16, .22, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .45
    for name, loc, power, color, size in [
        ('Softbox', (3, -4, 4), 450, (1, .84, .7), 4),
        ('Sky fill', (-3, -1, 3), 220, (.65, .8, 1), 3),
        ('Rim', (1, 3, 3.5), 550, (1, .9, .8), 3),
    ]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.shape, data.size = power, color, 'DISK', size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = loc
        obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add(location=(2.7, -5.2, 2.5))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, .95)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 2.25
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 780, 920, 100


def build_avatar():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    skin = material('Skin', (.59, .355, .23), .57)
    skin.node_tree.nodes['Principled BSDF'].inputs['Subsurface Weight'].default_value = .055
    hair = material('Hair', (.038, .023, .018), .8)
    jacket = material('Jacket', (.12, .20, .22), .86)
    pants = material('Trousers', (.075, .09, .105), .93)
    shirt = material('Shirt', (.64, .61, .55), .92)
    trim = material('Seam', (.055, .09, .095), .88)
    shoes = material('Leather', (.038, .032, .027), .52)
    rubber = material('Rubber', (.16, .145, .12), .88)
    eye = material('Eyes', (.028, .022, .016), .24)
    white = material('EyeWhite', (.62, .59, .53), .42)
    lips = material('Lips', (.34, .15, .11), .65)
    metal = material('Hardware', (.22, .20, .16), .35, .75)
    yy, xx = np.mgrid[0:256, 0:256]
    weave = .5 + .09 * np.sin(xx * math.pi / 2) * np.cos(yy * math.pi / 2)
    for mat in [jacket, pants, shirt]:
        surface_maps(mat, weave * .12, .82 + weave * .1)

    root = group('Character')
    body = group('Body', (0, 0, .96), root)
    loft('Hips', [(-.075,.13,.092,0),(-.05,.167,.107,0),(.07,.158,.099,0),(.09,.15,.095,0)], pants, body)
    loft('Overshirt', [(.02,.156,.105,0),(.045,.174,.122,0),(.09,.168,.12,0),(.23,.175,.125,-.008),(.37,.205,.124,0),(.43,.214,.10,.003),(.47,.125,.074,0),(.49,.083,.067,0)], jacket, body)
    box('Cotton shirt', (0,-.118,.395),(.105,.016,.155),shirt,body)
    for side in [-1, 1]:
        flap = box('Collar', (side*.072,-.119,.426),(.064,.022,.123), jacket,body,.008)
        flap.rotation_euler.y = side * -.32
        pocket = box('Pocket', (side*.112,-.122,.265),(.09,.02,.099), jacket,body,.01)
        line('Pocket stitch', [(side*.15,-.138,.302),(side*.15,-.138,.235),(side*.075,-.138,.235)],.0014,trim,body)
    line('Placket',[(.013,-.127,.055),(.013,-.136,.30),(.013,-.126,.37)],.006,trim,body)
    for z in [.09,.18,.28,.37]:
        ellipsoid('Button',(.016,-.142,z),(.005,.0025,.005),metal,body)
    loft('Neck',[(.44,.055,.052,0),(.52,.056,.052,0),(.58,.063,.056,-.007)],skin,body,subdiv=1)

    head = group('Head',(0,0,.555),body)
    loft('Anatomical head', [(-.015,.035,.04,-.012),(0,.052,.063,-.021),(.025,.072,.073,-.018),(.06,.086,.076,-.01),(.10,.091,.082,0),(.14,.089,.081,.004),(.18,.087,.078,.008),(.215,.073,.064,.011),(.235,.045,.042,.013),(.244,.003,.005,.013)],skin,head,segments=40,subdiv=2)
    # Low relief facial features, real-sized eyes, eyelids and ears.
    for side in [-1,1]:
        x=side*.036
        ellipsoid('Eye socket',(x,-.073,.116),(.026,.012,.017),skin,head)
        ellipsoid('Eye',(x,-.082,.116),(.017,.008,.0065),white,head)
        ellipsoid('Iris',(x,-.089,.116),(.0055,.002,.0053),eye,head)
        line('Upper eyelid',[(x-.018,-.083,.116),(x-.009,-.089,.122),(x+.007,-.089,.122),(x+.018,-.082,.116)],.0024,skin,head)
        line('Eyebrow',[(x-.022,-.080,.137),(x,-.087,.143),(x+.021,-.077,.14)],.0032,hair,head)
        ellipsoid('Ear',(side*.09,.001,.10),(.014,.021,.033),skin,head)
        ellipsoid('Ear concha',(side*.099,-.016,.101),(.006,.004,.017),lips,head)
        ellipsoid('Nostril wing',(side*.010,-.097,.077),(.008,.009,.006),skin,head)
    loft('Nose',[(.067,.007,.006,-.094),(.075,.012,.010,-.099),(.088,.010,.014,-.095),(.117,.007,.010,-.082),(.14,.005,.005,-.076)],skin,head,segments=20,subdiv=2)
    ellipsoid('Upper lip',(0,-.088,.049),(.025,.006,.0045),lips,head)
    ellipsoid('Lower lip',(0,-.087,.042),(.022,.005,.0045),lips,head)
    line('Mouth', [(-.023,-.090,.047),(0,-.093,.046),(.023,-.090,.047)],.001,eye,head)
    # Scalp follows a varying hairline; no spherical hair mass covering the face.
    verts, faces = [], []
    for i in range(10):
        t=i/9
        for j in range(40):
            a=j*TAU/40
            front=max(0,-math.sin(a))
            bottom=.065+.105*front
            z=bottom+( .258-bottom)*math.sin(t*math.pi/2)
            # Fit the scalp to the actual head profile, including temples.
            heights=[.06,.10,.14,.18,.215,.235,.244,.258]
            width=float(np.interp(z,heights,[.086,.091,.089,.087,.073,.045,.009,.001]))+.004
            depth=float(np.interp(z,heights,[.076,.082,.081,.078,.064,.042,.009,.001]))+.004
            offset=float(np.interp(z,heights,[-.01,0,.004,.008,.011,.013,.013,.013]))
            verts.append((width*math.cos(a),offset+depth*math.sin(a),z))
    for i in range(9):
        for j in range(40):
            a=i*40+j;b=i*40+(j+1)%40
            faces.append((a,b,b+40,a+40))
    mesh=bpy.data.meshes.new('Hair cap');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('Hair cap',mesh);bpy.context.collection.objects.link(obj);finish(obj,hair,head)
    for j in range(14):
        x=-.073+j*.011
        z=.20+.035*(1-(x/.09)**2)
        line('Combed strand',[(x,-.068,z-.029),(x-.012,-.049,z+.003),(x-.017,-.005,z+.016),(x-.012,.045,z-.005)],.0018,hair,head)

    for side, label in [(-1,'Left'),(1,'Right')]:
        arm=group(label+'Arm',(side*.21,0,.405),body)
        loft('Sleeve',[(-.295,.048,.048,0),(-.26,.053,.055,0),(-.17,.061,.06,0),(-.035,.073,.072,0),(.015,.049,.05,0)],jacket,arm)
        elbow=group(label+'Forearm',(0,0,-.275),arm)
        ellipsoid('Elbow seam',(0,0,0),(.048,.048,.057),jacket,elbow)
        loft('Forearm sleeve',[(-.25,.036,.038,-.01),(-.23,.044,.042,-.01),(-.12,.047,.046,0),(.02,.049,.047,0)],jacket,elbow)
        loft('Cuff',[(-.259,.039,.039,-.01),(-.22,.042,.044,-.01)],trim,elbow)
        ellipsoid('Palm',(0,-.007,-.299),(.034,.023,.052),skin,elbow)
        for f in range(4):
            ellipsoid('Finger',(-.025+f*.016,-.009,-.336),(.008,.013,.027-abs(f-1)*.003),skin,elbow)
        ellipsoid('Thumb',(side*-.033,-.019,-.293),(.013,.017,.027),skin,elbow)
        leg=group(label+'Leg',(side*.093,0,0),body)
        loft('Trouser thigh',[(-.44,.059,.069,0),(-.40,.065,.074,-.005),(-.25,.077,.084,0),(-.075,.091,.095,0),(.016,.082,.08,0)],pants,leg)
        knee=group(label+'Shin',(0,0,-.43),leg)
        ellipsoid('Knee fabric',(0,0,0),(.059,.068,.065),pants,knee)
        loft('Trouser calf',[(-.39,.048,.054,0),(-.35,.053,.060,.007),(-.23,.060,.073,.013),(-.12,.063,.075,.008),(.018,.059,.069,0)],pants,knee)
        for z in [-.08,-.33]:
            line('Trouser fold',[(-.041,-.048,z),(-.012,-.065,z+.008),(.039,-.052,z-.009)],.0025,pants,knee)
        loft('Leather shoe',[(-.498,.056,.12,-.037),(-.477,.062,.127,-.037),(-.435,.058,.115,-.028),(-.405,.052,.087,-.008),(-.382,.047,.053,.015)],shoes,knee)
        box('Sole',(0,-.04,-.507),(.125,.265,.029),rubber,knee,.014)
        ellipsoid('Shoe tongue',(0,-.042,-.393),(.037,.065,.016),shoes,knee)
        for k in range(4):
            line('Lace',[(-.025,-.078+k*.015,-.395),(.025,-.072+k*.015,-.395)],.002,shirt,knee)
    merge_parts()
    export(OUT / 'citizen_realistic.glb')
    studio()
    floor=box('Studio floor',(0,0,-.05),(200,200,.05),material('Studio floor',(.16,.18,.20)),bevel=.001)
    bpy.ops.wm.save_as_mainfile(filepath=str(ART/'citizen_realistic.blend'))
    bpy.context.scene.render.filepath=str(ART/'citizen_preview.png')
    bpy.ops.render.render(write_still=True)


def world_uv(obj, scale):
    mesh=obj.data
    uv=mesh.uv_layers.active or mesh.uv_layers.new()
    for poly in mesh.polygons:
        normal=poly.normal
        axis=max(range(3),key=lambda a:abs(normal[a]))
        axes=[a for a in range(3) if a!=axis]
        for i in poly.loop_indices:
            v=obj.matrix_world @ mesh.vertices[mesh.loops[i].vertex_index].co
            uv.data[i].uv=(v[axes[0]]/scale[0],v[axes[1]]/scale[1])


def batch_environment():
    """Batch static surfaces by material and spatial strip for fewer web draw calls."""
    batches={}
    for obj in list(bpy.context.scene.objects):
        if obj.type!='MESH' or len(obj.data.materials)!=1:continue
        if re.search('Neon|GlowBelt|LightBand|Crown|Ribbon|Heart|Screen',obj.name):continue
        bpy.context.view_layer.objects.active=obj
        for modifier in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        if re.match(r'^(BundLamp|BundBench|Railing|Tree)',obj.name):
            category='Railing_Batched'
        elif re.match(r'^(Bund_|Heritage)',obj.name):
            category='Bund_Surface'
        else:category='City_Static'
        strip=math.floor(obj.location.x/30)
        key=(category,obj.data.materials[0].name,strip)
        batches.setdefault(key,[]).append(obj)
    for key,objects in batches.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        bpy.context.object.name='_'.join(map(str,key))


def build_environment():
    bpy.ops.wm.open_mainfile(filepath=str(ART/'shanghai_bund.blend'))
    bpy.context.preferences.filepaths.save_version=0
    rng=np.random.default_rng(24)
    yy,xx=np.mgrid[0:512,0:512]
    tile_x=(xx+(yy//128%2)*128)%256
    tile_y=yy%128
    edge=np.minimum.reduce([tile_x,255-tile_x,tile_y,127-tile_y])
    joints=np.clip(edge/2,0,1)
    noise=rng.normal(0,.018,(512,512))
    variation=rng.uniform(-.035,.035,(4,3))[yy//128,((xx+(yy//128%2)*128)//256)]
    value=(.48+noise+variation)*(.45+.55*joints)
    granite=material('Granite_PBR',(.48,.47,.44),.75)
    texture(granite,image_data('Granite_albedo',np.stack([value*1.04,value*1.015,value*.97],axis=-1)),'Base Color')
    surface_maps(granite,joints*.18+noise*.4,np.clip(.73+noise+variation,0,1))
    stone=material('Limestone_PBR',(.6,.55,.46),.85)
    texture(stone,image_data('Limestone_albedo',np.stack([value*1.25,value*1.16,value*1.02],axis=-1)),'Base Color')
    surface_maps(stone,joints*.1+noise*.3,np.full((512,512),.83))
    # Window atlas: varied occupation, mullions and warm interior depth.
    glass=material('CurtainWall_PBR',(.12,.18,.22),.28,.48)
    cellx,celly=xx%64,yy%64
    frame=(cellx<4)|(celly<4)
    occupied=rng.random((8,8))>.50
    lit=occupied[yy//64,xx//64]&~frame
    glass_rgb=np.zeros((512,512,3),dtype=np.float32)+[.07,.10,.135]
    glass_rgb[frame]=[.038,.046,.055]
    glass_rgb[lit]=[.22,.205,.17]
    emission=np.zeros_like(glass_rgb)
    emission[lit]=[.11,.075,.038]
    emission[(celly<11)&lit]*=.3
    texture(glass,image_data('Facade_albedo',glass_rgb),'Base Color')
    texture(glass,image_data('Facade_occupied_rooms',emission),'Emission Color')
    glass.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=.7
    glass_names={'M_ShanghaiTowerGlass','M_SWFCGlass','M_CitiBlue'}
    for obj in list(bpy.context.scene.objects):
        if obj.type!='MESH':continue
        names={m.name for m in obj.data.materials if m}
        replacement=None
        if names & {'M_BundGranite','M_BundSeawall','M_BundCurb'}:
            replacement=granite;world_uv(obj,(2.4,2.4))
        elif names & {'M_HeritageStone','M_HeritageGraniteDark'}:
            replacement=stone;world_uv(obj,(4,4))
        elif names & glass_names:
            replacement=glass;world_uv(obj,(8,12))
        if replacement:
            for slot in obj.material_slots:slot.material=replacement
        if any(word in obj.name for word in ['Sphere','Globe','Pearl_Leg','Pearl_BaseShaft','Pearl_MainShaft','GlowBelt','LightBand']):
            for poly in obj.data.polygons:poly.use_smooth=True
        # Small edge highlights on foreground hard surfaces, never round the skyline.
        if obj.name.startswith(('Bund_Elevated','Bund_Promenade','Railing_Top','BundBench')):
            bevel=obj.modifiers.new('Worn edge highlights','BEVEL');bevel.width=.018;bevel.segments=2
    for mat in bpy.data.materials:
        if not mat.use_nodes:continue
        bsdf=mat.node_tree.nodes.get('Principled BSDF')
        if not bsdf:continue
        strength=bsdf.inputs.get('Emission Strength')
        if strength and strength.default_value>1:
            strength.default_value=min(1.2,strength.default_value*.13)
        if mat.name=='M_CastIronBlack':
            bsdf.inputs['Roughness'].default_value=.48
            bsdf.inputs['Metallic'].default_value=.7
    bpy.ops.wm.save_as_mainfile(filepath=str(ART/'bund_realistic.blend'))
    batch_environment()
    export(OUT/'bund_realistic.glb')


if __name__=='__main__':
    if '--environment-only' not in sys.argv:build_avatar()
    if '--avatar-only' not in sys.argv:build_environment()
