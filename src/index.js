import React, { useEffect, useMemo, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'

import * as THREE from 'three'
import { apply, Canvas } from 'react-three-fiber'
import { useSpring, a } from 'react-spring/three'

import { useAsync } from './useAsync'
import * as resources from './resources/index'
import { FBXLoader } from './resources/loaders/FBXLoader'

import './styles.css'
// Make extra stuff available as native-elements (<effectComposer />, etc.)
apply(resources)

/* 
function Content() {
  const { viewport } = useThree()
  const aspect = viewport.width / 6
  const [springs, set] = useSprings(number, i => ({
    from: random(),
    ...random(),
    config: { mass: 20, tension: 500, friction: 200 }
  }))
  useEffect(() => void setInterval(() => set(i => ({ ...random(), delay: i * 50 })), 4000), [])
  return springs.map(({ color, ...props }, index) => (
    <a.mesh key={index} {...props}>
      <planeBufferGeometry attach="geometry" args={[0.1 + Math.random() * aspect, 0.1 + Math.random() * aspect]} />
      <a.meshPhongMaterial attach="material" color={color} />
    </a.mesh>
  ))
}
 */

function Cube({ children }) {
  const rotation = () => ({
    rotation: [1, THREE.Math.degToRad(Math.random() * 90), THREE.Math.degToRad(Math.random() * 90)],
    from: { rotation: [1, THREE.Math.degToRad(Math.random() * 90), THREE.Math.degToRad(Math.random() * 90)] }
  })

  const [props, set, stop] = useSpring(() => rotation())
  useEffect(() => void setInterval(() => set({ ...rotation() }), 4000), [])

  return (
    <a.mesh visible userData={{ test: 'hello' }} position={[2, 2, 3]} rotation={props.rotation} scale={props.rotation}>
      <a.boxGeometry attach="geometry" args={[14, 14, 14]} />
      <meshStandardMaterial attach="material" color="white" transparent>
        {children}
      </meshStandardMaterial>
    </a.mesh>
  )
}

function Texture({ url }) {
  const texture = useMemo(() => new THREE.TextureLoader().load(url), [url])
  return <primitive attach="map" object={texture} />
}
function loadFBX(url) {
  return new Promise((resolve, reject) => {
    try {
      console.log('loading...', url)
      new FBXLoader().load(url, x => resolve(x), x => x)
    } catch (e) {
      reject(e)
    }
  })
}
function loadAllFBX(filenames) {
  return new Promise((resolve, reject) => {
    console.log('loading...', filenames)
    const promises = filenames.map(f => loadFBX(`/${f}.fbx`))
    const result = promises.reduce((prev, curr) => {
      return prev.then(x => curr.then(y => x.concat(y))).catch(reject)
    }, Promise.resolve([]))
    return resolve(result)
  })
}

function useAllFBX(filenames) {
  if (!filenames) throw Error(`[useFBX] Missing filenames argument: ${filenames}`)
  return useAsync(loadAllFBX, [filenames])
}

function useAnimation() {
  const anim = () => ({
    rotation: [1, THREE.Math.degToRad(Math.random() * 90), THREE.Math.degToRad(Math.random() * 90)],
    from: { rotation: [1, THREE.Math.degToRad(Math.random() * 90), THREE.Math.degToRad(Math.random() * 90)] }
  })

  const [animation, setAnimation, stopAnimation] = useSpring(() => anim())
  useEffect(() => void setInterval(() => setAnimation({ ...anim() }), 4000), [])

  // return (
  //   <a.mesh visible userData={{ test: 'rotations' }} position={[0, 0, 0]}>
  //     {React.Children.map(children, (child, i) => {
  //       console.log(child.props)
  //       return (
  //        <primitive key={i} {...child.props} position={[0, 0, 0]} rotation={rot.rotation} scale={rot.rotation} />
  //     )})}
  //   </a.mesh>
  // )
  return { animation, setAnimation, stopAnimation }
}

function useInflate(inflate) {
  const [triggered, setTriggered] = useState(inflate)
  const [inflation, setInflation, stopInflation] = useSpring(() => ({from:{scale:[2, 2, 2]}}) )
  console.log("useInflate",triggered)
  triggered ? setInflation({scale:[4, 2, 2]}) : setInflation({scale:[2, 2, 2], from:{scale:[4, 2, 2]}}) 
  return {inflation, setTriggered}
}

function Plane() {
  const [filenames, setFilenames] = useState(['cube extruded2', 'cube'])
  const { animation } = useAnimation()
  const { inflation, setTriggered } = useInflate(false)
  
  const planeBody = useAllFBX(filenames)
  if (planeBody.error) console.log('error:', planeBody.error)
  if (planeBody.loading) return null
  const [body, head] = planeBody.result
 
  return (
    <a.group {...animation}>
      <a.primitive onPointerOver={e => setTriggered(t =>!t)} object={body.children[0]} position={[0, 2, 3]} scale={[2, 2, 2]} {...inflation}/>
      <a.primitive object={head.children[0]} position={[6, 2, 3]} scale={[3, 3, 3]} />
    </a.group>
  )
}

export default function App() {
  return (
    <div className="main" style={{ color: '#172717' }}>
      <Canvas style={{ background: '#A2CCB6' }} camera={{ position: [0, 0, 50] }}>
        <ambientLight intensity={0.9} />
        <spotLight intensity={0.8} position={[300, 300, 4000]} />
        {/*         <Cube>
          <Texture url="/paper.jpg" />
        </Cube> */}
        <Plane />
      </Canvas>
      <span className="header-left">Todo: build groups</span>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
