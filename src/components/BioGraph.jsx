import { useRef, useCallback, useEffect } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'

const CATEGORY_COLORS = {
  mechanism: '#22d3ee',
  target: '#06b6d4',
  pathway: '#3b82f6',
  action: '#818cf8',
  gene: '#e879f0',
  symptom: '#f472b6',
}

function createGlowTexture(hexColor) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`)
  gradient.addColorStop(0.15, `rgba(${r},${g},${b},0.6)`)
  gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.15)`)
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const textureCache = {}
function getGlowTexture(hex) {
  if (!textureCache[hex]) {
    textureCache[hex] = createGlowTexture(hex)
  }
  return textureCache[hex]
}

/**
 * Force-directed 3D graph with glowing bioluminescent nodes.
 *
 * Supports two modes:
 *  - Single-domain: set accentHue ('cyan' | 'magenta') for uniform palette.
 *  - Merged: nodes carry their own `color` field; linkColor / linkWidth
 *    can be functions for per-link styling.
 */
export default function BioGraph({
  graphData,
  accentHue,
  linkColor,
  linkWidth,
  linkOpacity,
  onNodeClick,
  onLinkClick,
  ...rest
}) {
  const fgRef = useRef()

  const defaultLinkColor = accentHue === 'cyan'
    ? 'rgba(34,211,238,0.12)'
    : accentHue === 'magenta'
      ? 'rgba(232,121,240,0.12)'
      : 'rgba(255,255,255,0.06)'

  const resolvedLinkColor =
    typeof linkColor === 'function'
      ? linkColor
      : () => linkColor || defaultLinkColor

  const resolvedLinkWidth =
    typeof linkWidth === 'function' ? linkWidth : () => linkWidth ?? 0.4

  const nodeThreeObject = useCallback((node) => {
    const color =
      node.color ||
      CATEGORY_COLORS[node.category] ||
      (accentHue === 'cyan' ? '#22d3ee' : '#e879f0')

    const group = new THREE.Group()

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 24, 24),
      new THREE.MeshBasicMaterial({ color })
    )
    group.add(sphere)

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getGlowTexture(color),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    )
    sprite.scale.set(18, 18, 1)
    group.add(sprite)

    return group
  }, [accentHue])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return

    fg.d3Force('charge')?.strength(-120)
    fg.d3Force('link')?.distance(40)
  }, [graphData])

  const nodeLabel = useCallback(
    (node) =>
      `<div style="background:rgba(6,6,15,0.88);backdrop-filter:blur(12px);padding:10px 14px;border-radius:10px;font-size:15px;font-weight:300;max-width:240px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.4)">
        <strong style="color:#fafafa;font-weight:300">${node.label}</strong>
        <div style="color:#a1a1aa;margin-top:4px;font-size:11px;letter-spacing:0.04em;text-transform:uppercase">${node.category}</div>
        ${node.description ? `<div style="color:#a1a1aa;margin-top:8px;font-size:14px;font-weight:300;line-height:1.45">${node.description}</div>` : ''}
      </div>`,
    []
  )

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      backgroundColor="rgba(0,0,0,0)"
      showNavInfo={false}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      nodeLabel={nodeLabel}
      linkColor={resolvedLinkColor}
      linkWidth={resolvedLinkWidth}
      linkOpacity={linkOpacity ?? 0.3}
      onNodeClick={onNodeClick}
      onLinkClick={onLinkClick}
      {...rest}
    />
  )
}
