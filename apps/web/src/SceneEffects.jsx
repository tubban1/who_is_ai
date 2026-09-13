import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2, MathUtils, ShaderMaterial } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// 电影级人像特写景深 Shader：在聚焦主体周围提供零模糊保护区（人物 100% 锐利），仅背景大光圈虚化
const CinematicPortraitFragmentShader = /* glsl */`
  #include <common>

  varying vec2 vUv;

  uniform sampler2D tColor;
  uniform sampler2D tDepth;

  uniform float maxblur;
  uniform float aperture;

  uniform float nearClip;
  uniform float farClip;

  uniform float focus;
  uniform float focusRange;
  uniform float aspect;

  #include <packing>

  float getDepth(const in vec2 screenPosition) {
    #if DEPTH_PACKING == 1
    return unpackRGBAToDepth(texture2D(tDepth, screenPosition));
    #else
    return texture2D(tDepth, screenPosition).x;
    #endif
  }

  float getViewZ(const in float depth) {
    #if PERSPECTIVE_CAMERA == 1
    return perspectiveDepthToViewZ(depth, nearClip, farClip);
    #else
    return orthographicDepthToViewZ(depth, nearClip, farClip);
    #endif
  }

  void main() {
    float depth = getDepth(vUv);
    float viewZ = getViewZ(depth);
    float dist = -viewZ;

    // 前景主体聚焦保护带：
    // 在对焦点前后 focusRange（0.85米）范围内的主体，绝对不产生任何模糊（保证面部五官与眼神极其锐利）
    float delta = abs(dist - focus);
    float blurFactor = smoothstep(focusRange, focusRange + 2.5, delta);

    // 近距离特写防误糊保护：相机前 3.2米以内的近距离人像区域强制保持清晰
    if (dist < 3.2 && delta < (focusRange + 0.6)) {
      blurFactor = 0.0;
    }

    // 主体像素或光圈关闭时，直接无损输出原图颜色
    if (blurFactor <= 0.001 || aperture <= 0.0001) {
      gl_FragColor = texture2D(tColor, vUv);
      return;
    }

    vec2 aspectcorrect = vec2(1.0, aspect);
    vec2 dofblur = vec2(clamp(blurFactor * aperture * 1.8, 0.0, maxblur));

    // 29-tap 电影散景圆盘采样 (Cinematic Bokeh Disc Sampling)
    vec4 col = vec4(0.0);
    col += texture2D(tColor, vUv);
    col += texture2D(tColor, vUv + (vec2( 0.0,   0.4  ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.15,  0.37 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.29,  0.29 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.37,  0.15 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.40,  0.0  ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.37, -0.15 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.29, -0.29 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.15, -0.37 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.0,  -0.4  ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.15,  0.37 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.29,  0.29 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.37,  0.15 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.40,  0.0  ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.37, -0.15 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2(-0.29, -0.29 ) * aspectcorrect) * dofblur);
    col += texture2D(tColor, vUv + (vec2( 0.15, -0.37 ) * aspectcorrect) * dofblur);

    col += texture2D(tColor, vUv + (vec2( 0.15,  0.37 ) * aspectcorrect) * (dofblur * 0.9));
    col += texture2D(tColor, vUv + (vec2(-0.37,  0.15 ) * aspectcorrect) * (dofblur * 0.9));
    col += texture2D(tColor, vUv + (vec2( 0.37, -0.15 ) * aspectcorrect) * (dofblur * 0.9));
    col += texture2D(tColor, vUv + (vec2(-0.15, -0.37 ) * aspectcorrect) * (dofblur * 0.9));

    col += texture2D(tColor, vUv + (vec2( 0.29,  0.29 ) * aspectcorrect) * (dofblur * 0.7));
    col += texture2D(tColor, vUv + (vec2( 0.40,  0.0  ) * aspectcorrect) * (dofblur * 0.7));
    col += texture2D(tColor, vUv + (vec2(-0.29,  0.29 ) * aspectcorrect) * (dofblur * 0.7));
    col += texture2D(tColor, vUv + (vec2(-0.40,  0.0  ) * aspectcorrect) * (dofblur * 0.7));

    col += texture2D(tColor, vUv + (vec2( 0.29, -0.29 ) * aspectcorrect) * (dofblur * 0.4));
    col += texture2D(tColor, vUv + (vec2( 0.0,  -0.4  ) * aspectcorrect) * (dofblur * 0.4));
    col += texture2D(tColor, vUv + (vec2(-0.29, -0.29 ) * aspectcorrect) * (dofblur * 0.4));
    col += texture2D(tColor, vUv + (vec2( 0.0,   0.4  ) * aspectcorrect) * (dofblur * 0.4));

    gl_FragColor = col / 29.0;
  }
`;

export default function SceneEffects({ timeOfDay, conversationOpen = false, focusDistance = 2.25 }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const pipeline = useMemo(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const bokeh = new BokehPass(scene, camera, {
      focus: focusDistance,
      aperture: 0.0,
      maxblur: 0.015,
      width: size.width,
      height: size.height
    });
    bokeh.enabled = false;

    // 挂载主体保护特写景深 Shader
    const customBokehMat = new ShaderMaterial({
      defines: {
        DEPTH_PACKING: 1,
        PERSPECTIVE_CAMERA: 1
      },
      uniforms: {
        ...bokeh.uniforms,
        focusRange: { value: 0.85 } // 主体 100% 绝对清晰保护带宽
      },
      vertexShader: bokeh.materialBokeh.vertexShader,
      fragmentShader: CinematicPortraitFragmentShader
    });
    bokeh.materialBokeh = customBokehMat;
    bokeh.uniforms = customBokehMat.uniforms;
    if (bokeh.fsQuad) {
      bokeh.fsQuad.material = customBokehMat;
    }

    const bloom = new UnrealBloomPass(new Vector2(512, 512), 0.32, 0.4, 1.0);
    const output = new OutputPass();
    composer.addPass(render);
    composer.addPass(bokeh);
    composer.addPass(bloom);
    composer.addPass(output);
    return { composer, render, bokeh, bloom, output };
  }, [gl, scene, camera]);

  useEffect(() => {
    pipeline.composer.setPixelRatio(Math.min(viewport.dpr, 1.25));
    pipeline.composer.setSize(size.width, size.height);
    if (pipeline.bokeh.setSize) pipeline.bokeh.setSize(size.width, size.height);
  }, [pipeline, size.width, size.height, viewport.dpr]);

  useEffect(() => () => {
    pipeline.bokeh.dispose();
    pipeline.bloom.dispose();
    pipeline.output.dispose();
    pipeline.render.dispose();
    pipeline.composer.dispose();
  }, [pipeline]);

  useFrame((_, dt) => {
    const targetAperture = conversationOpen ? 0.024 : 0.0;
    const curAperture = MathUtils.damp(pipeline.bokeh.uniforms['aperture'].value, targetAperture, 5.5, dt);
    pipeline.bokeh.uniforms['aperture'].value = curAperture;
    pipeline.bokeh.uniforms['focus'].value = MathUtils.damp(pipeline.bokeh.uniforms['focus'].value, focusDistance, 6.0, dt);
    pipeline.bokeh.enabled = (curAperture > 0.0004);

    if (timeOfDay === 'night' || conversationOpen || pipeline.bokeh.enabled) {
      pipeline.composer.render(dt);
    } else {
      gl.render(scene, camera);
    }
  }, 1);

  return null;
}
