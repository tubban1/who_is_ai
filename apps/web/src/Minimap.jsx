import React, { useState, useMemo } from 'react';

/**
 * Detailed Landmark Registry for Shanghai The Bund & Lujiazui Megacity
 */
export const LANDMARKS = [
  // 1. 陆家嘴金融城 (Pudong Skyline & Waterfront)
  {
    id: 'pearl',
    name: '东方明珠广播电视塔',
    short: '东方明珠',
    icon: '🗼',
    x: -10,
    z: -148,
    cat: 'pudong',
    desc: '高468米，标志性双球粉红霓虹光环与太空舱，浦江第一地标',
    color: '#ec4899'
  },
  {
    id: 'convention',
    name: '上海国际会议中心',
    short: '国际会议中心',
    icon: '🔮',
    x: -4,
    z: -130,
    cat: 'pudong',
    desc: '滨江标志性双玻璃球体与宏伟柱廊，APEC与重要国事会议会场',
    color: '#06b6d4'
  },
  {
    id: 'sh_tower',
    name: '上海中心大厦',
    short: '上海中心',
    icon: '🏙️',
    x: 28,
    z: -205,
    cat: 'pudong',
    desc: '高632米中国第一高楼，螺旋扭转外立面与对角翡翠激光光带',
    color: '#10b981'
  },
  {
    id: 'swfc',
    name: '上海环球金融中心',
    short: '环球金融',
    icon: '🍾',
    x: 16,
    z: -185,
    cat: 'pudong',
    desc: '高492米摩天楼，顶部倒梯形风洞观光天桥（标志性"开瓶器"）',
    color: '#0284c7'
  },
  {
    id: 'jinmao',
    name: '金茂大厦',
    short: '金茂大厦',
    icon: '🏛️',
    x: 40,
    z: -172,
    cat: 'pudong',
    desc: '高420.5米经典88层宝塔式金黄琥珀外立面，传统密檐塔意象',
    color: '#f59e0b'
  },
  {
    id: 'aurora',
    name: '震旦国际大厦',
    short: '震旦大厦',
    icon: '📺',
    x: -34,
    z: -136,
    cat: 'pudong',
    desc: '标志性流线弧面金色幕墙，世界著名的巨幅"I❤️SH"江景LED屏',
    color: '#ef4444'
  },
  {
    id: 'citi',
    name: '花旗集团大厦',
    short: '花旗大厦',
    icon: '🏦',
    x: 54,
    z: -140,
    cat: 'pudong',
    desc: '深蓝玻璃幕墙、水平发光百叶带与顶层标志性红色拱形citi灯标与金色皇冠',
    color: '#0284c7'
  },
  {
    id: 'ifc',
    name: '上海国金中心 (IFC)',
    short: '国金双子',
    icon: '💎',
    x: -22,
    z: -172,
    cat: 'pudong',
    desc: '佩里设计事务所设计的钻石切角水晶多面体双子塔',
    color: '#a855f7'
  },
  {
    id: 'skybridge',
    name: '陆家嘴环形人行天桥',
    short: '环形天桥',
    icon: '⭕',
    x: -10,
    z: -146,
    cat: 'pudong',
    desc: '东方明珠脚下的圆形发光景观人行天桥，连接陆家嘴主要枢纽',
    color: '#06b6d4'
  },

  // 2. 黄浦江航道与游船 (Huangpu River & Cruises)
  {
    id: 'flagship',
    name: '浦江豪华双层游览旗舰',
    short: '旗舰游轮',
    icon: '🚢',
    x: 24,
    z: -62,
    cat: 'boat',
    desc: '双层落地全景落地窗观光旗舰船，航行于主航道东侧',
    color: '#f43f5e'
  },
  {
    id: 'dragon_boat',
    name: '古典画舫龙舟游船',
    short: '古风画舫',
    icon: '🏮',
    x: -26,
    z: -52,
    cat: 'boat',
    desc: '双层金顶飞檐挂红灯笼的中式古典水上画舫',
    color: '#eab308'
  },
  {
    id: 'catamaran',
    name: '高速双体水上快艇',
    short: '高速快艇',
    icon: '🛥️',
    x: -6,
    z: -78,
    cat: 'boat',
    desc: '现代流线型双体巡游游艇，穿梭于江心开阔水域',
    color: '#06b6d4'
  },
  {
    id: 'ferry',
    name: '经典复古上海轮渡',
    short: '市轮渡',
    icon: '⛴️',
    x: 38,
    z: -88,
    cat: 'boat',
    desc: '经典红白双色市轮渡，承载百年黄浦江水上交通记忆',
    color: '#10b981'
  },
  {
    id: 'pilot',
    name: '水上巡逻引航艇',
    short: '巡逻引航',
    icon: '🚤',
    x: -38,
    z: -70,
    cat: 'boat',
    desc: '航道巡逻与引航安全保障艇，亮黄顶灯与蓝白警示涂装',
    color: '#3b82f6'
  },

  // 3. 外滩万国历史建筑群 (The Bund Heritage Landmarks)
  {
    id: 'peace',
    name: '和平饭店 (Fairmont)',
    short: '和平饭店',
    icon: '🏨',
    x: -18,
    z: 48,
    cat: 'bund',
    desc: '1929年芝加哥学派哥特式，77米绿色铜皮金字塔尖顶，远东第一楼',
    color: '#10b981'
  },
  {
    id: 'customs',
    name: '江海关大楼',
    short: '海关钟楼',
    icon: '🕰️',
    x: 18,
    z: 48,
    cat: 'bund',
    desc: '1927年希腊多立克柱廊，亚洲第一大机械钟楼"大清钟"（海关大钟）',
    color: '#f59e0b'
  },
  {
    id: 'hsbc',
    name: '汇丰银行大楼',
    short: '汇丰大楼',
    icon: '🏛️',
    x: 48,
    z: 48,
    cat: 'bund',
    desc: '新古典主义希腊爱奥尼克巨柱宫殿，中央宏伟罗马式铜圆穹顶',
    color: '#eab308'
  },
  {
    id: 'boc',
    name: '中国银行大楼',
    short: '中国银行',
    icon: '🏯',
    x: -46,
    z: 48,
    cat: 'bund',
    desc: '现代中西合璧建筑，绿色琉璃瓦歇山顶与石质斗拱装饰',
    color: '#34d399'
  },
  {
    id: 'waibaidu',
    name: '外白渡桥',
    short: '外白渡桥',
    icon: '🌉',
    x: -84,
    z: -10,
    cat: 'bund',
    desc: '1907年百年双孔驼峰式钢桁架结构桥梁，外滩北端咽喉',
    color: '#fbbf24'
  },
  {
    id: 'heroes',
    name: '人民英雄纪念塔',
    short: '英雄塔',
    icon: '🎖️',
    x: -72,
    z: -14,
    cat: 'bund',
    desc: '黄浦公园60米高三枪矗立花岗岩纪念塔，苏州河与黄浦江交汇处',
    color: '#94a3b8'
  }
];

import { t, getLocalizedLandmark } from './i18n.js';

export default function Minimap({ playerPos, playerRotation = 0, strangers = [], language = 'zh' }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // all | pudong | bund | boat
  const [hoveredLandmark, setHoveredLandmark] = useState(null);

  const MAP_W = 240;
  const MAP_H = 220;

  // Accurately map world coordinates to minimap canvas:
  // World X: -90 to +90 (width 180)
  // World Z: -185 (North / Lujiazui) to +55 (South / Bund Heritage) (height 240)
  const worldToMap = (wx, wz) => {
    const mx = ((wx - (-90)) / 180) * (MAP_W - 28) + 14;
    const my = ((wz - (-185)) / 240) * (MAP_H - 28) + 14;
    return {
      x: Math.max(10, Math.min(MAP_W - 10, mx)),
      y: Math.max(10, Math.min(MAP_H - 10, my))
    };
  };

  const px = playerPos?.x ?? 0;
  const pz = playerPos?.z ?? -6;
  const pMap = worldToMap(px, pz);

  // Orientation angle in degrees
  const deg = (playerRotation * 180) / Math.PI;

  const filteredLandmarks = useMemo(() => {
    const localized = LANDMARKS.map(l => getLocalizedLandmark(l, language));
    if (activeCategory === 'all') return localized;
    return localized.filter(l => l.cat === activeCategory);
  }, [activeCategory, language]);

  return (
    <div className="minimap-container" style={{
      position: 'fixed',
      top: '72px',
      left: '20px',
      zIndex: 120,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pointerEvents: 'auto'
    }}>
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="glass"
          style={{
            background: 'rgba(10, 20, 32, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            color: '#38bdf8',
            padding: '7px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.6)'
          }}
        >
          <span>🗺️</span> {t('minimapTitle', language)}
        </button>
      ) : (
        <div style={{
          width: `${MAP_W}px`,
          background: 'rgba(7, 16, 28, 0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 10px 36px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}>
          {/* Top Title Bar */}
          <div style={{
            padding: '7px 12px',
            background: 'rgba(15, 28, 48, 0.85)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 800 }}>
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }}></span>
              {t('minimapTitle', language)}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                padding: '0 2px'
              }}
              title={t('mapCollapse', language)}
            >
              −
            </button>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '6px 8px',
            background: 'rgba(10, 18, 30, 0.75)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '10px'
          }}>
            {[
              { id: 'all', label: t('catAll', language) },
              { id: 'pudong', label: t('catPudong', language) },
              { id: 'bund', label: t('catBund', language) },
              { id: 'boat', label: t('catBoat', language) },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  borderRadius: '6px',
                  border: activeCategory === cat.id ? '1px solid #38bdf8' : '1px solid transparent',
                  background: activeCategory === cat.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat.id ? '#38bdf8' : '#64748b',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* SVG Map Canvas */}
          <div style={{ position: 'relative', width: `${MAP_W}px`, height: `${MAP_H}px` }}>
            <svg width={MAP_W} height={MAP_H} style={{ display: 'block' }}>
              <defs>
                <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </pattern>
                <radialGradient id="playerPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.4)" />
                  <stop offset="100%" stopColor="rgba(56,189,248,0.0)" />
                </radialGradient>
              </defs>

              <rect width={MAP_W} height={MAP_H} fill="url(#radarGrid)" />

              {/* Geographical Zone 1: Lujiazui Megacity (Top / North: Z < -135) */}
              <rect x="0" y="0" width={MAP_W} height="52" fill="rgba(15, 23, 42, 0.6)" />
              <text x="8" y="14" fill="#60a5fa" fontSize="8" fontWeight="700" opacity="0.6">
                {t('zonePudong', language)}
              </text>

              {/* Geographical Zone 2: Huangpu River Fairway (Middle: -135 <= Z <= -11.2) */}
              <rect x="0" y="52" width={MAP_W} height="114" fill="rgba(4, 38, 66, 0.55)" />
              {/* River currents / channel flow line */}
              <path
                d={`M 0 109 Q ${MAP_W / 3} 104, ${MAP_W / 2} 109 T ${MAP_W} 109`}
                fill="none"
                stroke="rgba(56,189,248,0.2)"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text x="8" y="66" fill="#38bdf8" fontSize="8" fontWeight="600" opacity="0.5">
                {t('zoneRiver', language)}
              </text>

              {/* Geographical Zone 3: Bund Elevated Promenade (Z: -11.2 to 0) */}
              <rect x="0" y="166" width={MAP_W} height="20" fill="rgba(45, 55, 72, 0.75)" stroke="rgba(56,189,248,0.3)" strokeWidth="0.5" />
              <text x="8" y="179" fill="#f1f5f9" fontSize="7.5" fontWeight="700" opacity="0.85">
                {t('zonePromenade', language)}
              </text>

              {/* Geographical Zone 4: Zhongshan East 1st Rd (Z: 0 to 24) */}
              <rect x="0" y="186" width={MAP_W} height="14" fill="rgba(20, 24, 32, 0.85)" />
              <line x1="0" y1="193" x2={MAP_W} y2="193" stroke="rgba(250,204,21,0.3)" strokeWidth="0.7" strokeDasharray="4,3" />

              {/* Geographical Zone 5: Heritage Buildings (Z: 24 to 55) */}
              <rect x="0" y="200" width={MAP_W} height="20" fill="rgba(38, 28, 20, 0.7)" />

              {/* Landmark Pins with Badges */}
              {filteredLandmarks.map((lm) => {
                const pos = worldToMap(lm.x, lm.z);
                const isHovered = hoveredLandmark?.id === lm.id;
                return (
                  <g
                    key={lm.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredLandmark(lm)}
                    onMouseLeave={() => setHoveredLandmark(null)}
                    onClick={() => setHoveredLandmark(lm)}
                  >
                    {/* Glowing outer halo if hovered */}
                    {isHovered && (
                      <circle cx="0" cy="0" r="10" fill={lm.color} opacity="0.35" />
                    )}
                    {/* Landmark pin dot */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isHovered ? "4.5" : "3.2"}
                      fill={lm.color}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? "1.2" : "0.8"}
                    />
                    {/* Landmark Short Label */}
                    <text
                      x="0"
                      y={pos.y < 25 ? "10" : "-6"}
                      textAnchor="middle"
                      fill={isHovered ? '#ffffff' : (lm.cat === 'pudong' ? '#93c5fd' : (lm.cat === 'boat' ? '#fb7185' : '#fde047'))}
                      fontSize="7"
                      fontWeight={isHovered ? 800 : 600}
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'rgba(7, 16, 28, 0.85)',
                        strokeWidth: '2px',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {lm.short}
                    </text>
                  </g>
                );
              })}

              {/* Surrounding Strangers / NPCs */}
              {strangers.map((s) => {
                const sm = worldToMap(s.x, s.z);
                const dist = Math.hypot((s.x || 0) - px, (s.z || 0) - pz);
                const isNear = dist < 4.2;
                return (
                  <g key={s.id}>
                    {isNear && (
                      <line
                        x1={pMap.x}
                        y1={pMap.y}
                        x2={sm.x}
                        y2={sm.y}
                        stroke="#fcd34d"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        opacity="0.9"
                      />
                    )}
                    <circle
                      cx={sm.x}
                      cy={sm.y}
                      r={isNear ? "4.2" : "2.8"}
                      fill={isNear ? "#fef08a" : "#fcd34d"}
                      stroke={isNear ? "#ca8a04" : "#0f172a"}
                      strokeWidth="0.8"
                    />
                  </g>
                );
              })}

              {/* Local Player Icon with Dynamic Radar & Direction Heading */}
              <g transform={`translate(${pMap.x}, ${pMap.y})`}>
                <circle cx="0" cy="0" r="14" fill="url(#playerPulse)" />
                {/* Heading Arrow: In 3D, rot.y 0 faces -Z (North/top), pointing UP */}
                <g transform={`rotate(${deg})`}>
                  <path d="M 0 -11 L 3.5 0 L -3.5 0 Z" fill="#38bdf8" />
                </g>
                <circle cx="0" cy="0" r="4.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.4" />
                <text x="0" y="11" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontWeight="800">
                  {t('youMap', language)}
                </text>
              </g>
            </svg>

            {/* Interactive Landmark Detail Tooltip Card */}
            {hoveredLandmark && (
              <div style={{
                position: 'absolute',
                bottom: '6px',
                left: '8px',
                right: '8px',
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${hoveredLandmark.color}`,
                borderRadius: '10px',
                padding: '7px 9px',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 800, fontSize: '11px', color: hoveredLandmark.color }}>
                    {hoveredLandmark.icon} {hoveredLandmark.name}
                  </span>
                  <span style={{
                    fontSize: '8.5px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#94a3b8'
                  }}>
                    {hoveredLandmark.cat === 'pudong' ? t('tagPudong', language) : (hoveredLandmark.cat === 'boat' ? t('tagBoat', language) : t('tagBund', language))}
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#cbd5e1', lineHeight: '1.35' }}>
                  {hoveredLandmark.desc}
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '3px' }}>
                  {t('distMeters', language, { dist: Math.hypot(hoveredLandmark.x - px, hoveredLandmark.z - pz).toFixed(0) })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Coordinate & Location Footer */}
          <div style={{
            padding: '5px 12px',
            background: 'rgba(10, 20, 32, 0.85)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9.5px',
            color: '#94a3b8'
          }}>
            <span style={{ color: pz < 0 ? '#38bdf8' : '#fde047', fontWeight: 700 }}>
              {pz < 0 ? t('locPromenade', language) : t('locHistoric', language)}
            </span>
            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
              X:{px.toFixed(1)} Z:{pz.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
