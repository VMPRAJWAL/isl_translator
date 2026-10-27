
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

function AvatarScene({ modelPath, pose, onRigDetected }) {
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => clone(scene), [scene]);

  const bones = useMemo(() => {
    const result = [];
    model.traverse((object) => {
      if (object.isBone) result.push(object);
    });
    return result;
  }, [model]);

  const initialRotations = useMemo(
    () => new Map(bones.map((bone) => [bone.uuid, bone.quaternion.clone()])),
    [bones]
  );

  useEffect(() => {
    const fingers = bones.filter((bone) =>
      /^finger[1-5]-[1-3]\.[LR]$/.test(bone.name)
    );

    onRigDetected({
      total: bones.length,
      fingers: fingers.length,
      left: fingers.filter((bone) => bone.name.endsWith(".L")).length,
      right: fingers.filter((bone) => bone.name.endsWith(".R")).length,
      names: fingers.map((bone) => bone.name),
    });
  }, [bones, onRigDetected]);

  useEffect(() => {
    bones.forEach((bone) => {
      const original = initialRotations.get(bone.uuid);
      if (original) bone.quaternion.copy(original);
    });

    if (pose === "open") return;

    bones.forEach((bone) => {
      const match = bone.name.match(
        /^finger([1-5])-([1-3])\.([LR])$/
      );

      if (!match) return;

      const fingerNumber = Number(match[1]);
      const segmentNumber = Number(match[2]);

      let angle = pose === "fist"
        ? (fingerNumber === 1 ? 0.3 : 0.65)
        : (fingerNumber === 1 ? 0.12 : 0.3);

      if (segmentNumber === 2) angle *= 0.8;
      if (segmentNumber === 3) angle *= 0.6;

      const rotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        angle
      );

      bone.quaternion.multiply(rotation);
    });
  }, [bones, initialRotations, pose]);

  return <primitive object={model} />;
}

export default function AvatarModelViewer({
  modelPath = "/models/male-base-mesh-base_male.glb",
}) {
  const [pose, setPose] = useState("open");
  const [rig, setRig] = useState(null);

  const handleRigDetected = useCallback((info) => {
    setRig(info);
  }, []);

  return (
    <div className="avatar-model-viewer">
      <div className="avatar-model-stage">
        <Canvas
          camera={{ position: [0, 1, 6], fov: 40 }}
          onCreated={({ gl }) => gl.setClearColor("#eeecff")}
        >
          <ambientLight intensity={1.7} />
          <directionalLight position={[3, 5, 4]} intensity={2} />
          <directionalLight position={[-3, 2, -2]} intensity={0.8} />

          <Suspense fallback={null}>
            <AvatarScene
              modelPath={modelPath}
              pose={pose}
              onRigDetected={handleRigDetected}
            />
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            minDistance={3}
            maxDistance={9}
            target={[0, 1, 0]}
          />
        </Canvas>
      </div>

      <div className="avatar-model-controls">
        <h3>Finger Rig Test</h3>

        <label htmlFor="hand-pose">Test hand pose</label>
        <select
          id="hand-pose"
          value={pose}
          onChange={(event) => setPose(event.target.value)}
        >
          <option value="open">Open hand — reset</option>
          <option value="partial">Partially curled fingers</option>
          <option value="fist">Curled fingers — fist test</option>
        </select>

        {!rig ? (
          <p>Loading skeleton...</p>
        ) : (
          <p>
            Total bones: {rig.total}
            <br />
            Finger bones matched: {rig.fingers}
            <br />
            Left: {rig.left} · Right: {rig.right}
          </p>
        )}

        <p>These are test poses, not verified ISL signs.</p>
      </div>
    </div>
  );
}
