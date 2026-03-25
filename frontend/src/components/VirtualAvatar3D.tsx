import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, PresentationControls } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface AvatarProps {
    avatarUrl: string
    texturaUrl?: string
    escala?: number
}

function AvatarModel({ avatarUrl, texturaUrl, escala = 1 }: AvatarProps) {
    const group = useRef<THREE.Group>(null)
    const { scene } = useGLTF(avatarUrl)
    const [texturaAplicada, setTexturaAplicada] = useState(false)

    useEffect(() => {
        if (!texturaUrl || texturaAplicada) return

        // Aplicar textura de prenda al cuerpo del avatar
        const textureLoader = new THREE.TextureLoader()

        textureLoader.load(
            texturaUrl,
            (texture) => {
                scene.traverse((child: any) => {
                    if (child.isMesh) {
                        // Buscar mallas del cuerpo (nombres comunes en Ready Player Me)
                        const nombreMalla = child.name.toLowerCase()
                        if (
                            nombreMalla.includes('body') ||
                            nombreMalla.includes('torso') ||
                            nombreMalla.includes('shirt') ||
                            nombreMalla.includes('cloth')
                        ) {
                            console.log(`🎨 Aplicando textura a: ${child.name}`)

                            // Crear material con la textura
                            child.material = new THREE.MeshStandardMaterial({
                                map: texture,
                                roughness: 0.7,
                                metalness: 0.1
                            })
                            child.material.needsUpdate = true
                        }
                    }
                })

                setTexturaAplicada(true)
                console.log('✅ Textura aplicada al avatar')
            },
            undefined,
            (error) => {
                console.error('❌ Error cargando textura:', error)
            }
        )
    }, [scene, texturaUrl, texturaAplicada])

    return (
        <primitive
            ref={group}
            object={scene}
            scale={escala}
            position={[0, -1, 0]}
        />
    )
}

interface VirtualAvatar3DProps {
    avatarUrl: string
    texturaUrl?: string
    onExportar?: () => void
}

export default function VirtualAvatar3D({
    avatarUrl,
    texturaUrl,
    onExportar
}: VirtualAvatar3DProps) {
    const [rotacionAutomatica, setRotacionAutomatica] = useState(true)

    return (
        <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black">
            {/* Canvas 3D */}
            <Canvas
                camera={{ position: [0, 0.5, 2.5], fov: 50 }}
                shadows
                gl={{ preserveDrawingBuffer: true }}
            >
                <Suspense fallback={null}>
                    {/* Iluminación */}
                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[5, 5, 5]}
                        intensity={1}
                        castShadow
                    />
                    <spotLight
                        position={[0, 5, 0]}
                        angle={0.3}
                        intensity={0.5}
                        castShadow
                    />
                    <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff00ff" />
                    <pointLight position={[5, 3, 5]} intensity={0.3} color="#00ffff" />

                    {/* Entorno */}
                    <Environment preset="city" />

                    {/* Avatar con controles */}
                    {rotacionAutomatica ? (
                        <PresentationControls
                            global
                            config={{ mass: 2, tension: 500 }}
                            snap={{ mass: 4, tension: 1500 }}
                            rotation={[0, 0, 0]}
                            polar={[-Math.PI / 3, Math.PI / 3]}
                            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                        >
                            <AvatarModel
                                avatarUrl={avatarUrl}
                                texturaUrl={texturaUrl}
                                escala={1}
                            />
                        </PresentationControls>
                    ) : (
                        <AvatarModel
                            avatarUrl={avatarUrl}
                            texturaUrl={texturaUrl}
                            escala={1}
                        />
                    )}

                    {/* Controles manuales */}
                    {!rotacionAutomatica && (
                        <OrbitControls
                            enableZoom={true}
                            enablePan={false}
                            minDistance={1.5}
                            maxDistance={5}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 1.5}
                        />
                    )}

                    {/* Piso con sombra */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -1, 0]}
                        receiveShadow
                    >
                        <planeGeometry args={[10, 10]} />
                        <shadowMaterial opacity={0.3} />
                    </mesh>
                </Suspense>
            </Canvas>

            {/* Controles UI */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                <button
                    onClick={() => setRotacionAutomatica(!rotacionAutomatica)}
                    className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all"
                >
                    {rotacionAutomatica ? '🔒 Bloquear' : '🔄 Auto-rotar'}
                </button>

                {onExportar && (
                    <button
                        onClick={onExportar}
                        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all"
                    >
                        📸 Capturar
                    </button>
                )}
            </div>

            {/* Indicador de carga */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/50 px-6 py-3 rounded-lg backdrop-blur-sm">
                <p className="text-white text-sm">
                    💡 <span className="font-semibold">Tip:</span> Arrastra para rotar • Scroll para zoom
                </p>
            </div>
        </div>
    )
}

// Precargar modelos GLB para mejor performance
useGLTF.preload('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb')
