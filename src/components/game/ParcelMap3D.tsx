"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Home, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Parcel, ParcelType } from "@/lib/game/types";
import { COLS, ROWS } from "@/lib/game/parcels";

type FilterKey = "all" | "housing" | "civic" | "commerce" | "protected" | "land-trust" | "risk";

export interface ParcelMap3DProps {
  parcels: Parcel[];
  highlight?: number[];
  onHover?: (p: Parcel | null) => void;
  onClick?: (p: Parcel) => void;
}

const housingTypes = new Set<ParcelType>([
  "single-family",
  "two-flat",
  "three-flat",
  "courtyard",
  "tower",
  "rehab-tower",
  "land-trust",
]);

const civicTypes = new Set<ParcelType>([
  "school",
  "library",
  "clinic",
  "church",
  "park",
  "community-garden",
  "mural",
  "transit",
]);

const commerceTypes = new Set<ParcelType>(["commercial", "industrial"]);

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "housing", label: "Housing" },
  { key: "civic", label: "Civic" },
  { key: "commerce", label: "Commerce" },
  { key: "protected", label: "Protected" },
  { key: "land-trust", label: "Land trust" },
  { key: "risk", label: "At risk" },
];

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function isAtRisk(p: Parcel): boolean {
  if (p.protected || p.owner === "land-trust" || p.type === "land-trust") return false;
  if (!housingTypes.has(p.type) || p.residents <= 0) return false;
  return p.owner === "absentee" || p.owner === "speculator" || p.value >= 58 || p.memory <= 44 || p.condition <= 38;
}

function isFilteredIn(p: Parcel, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "housing") return housingTypes.has(p.type);
  if (filter === "civic") return civicTypes.has(p.type);
  if (filter === "commerce") return commerceTypes.has(p.type);
  if (filter === "protected") return p.protected;
  if (filter === "land-trust") return p.owner === "land-trust" || p.type === "land-trust";
  if (filter === "risk") return isAtRisk(p);
  return true;
}

function holcColor(p: Parcel): string {
  switch (p.holc) {
    case "A": return "#BFD9A8";
    case "B": return "#B9CDDF";
    case "C": return "#E2C668";
    case "D": return "#D88B7C";
    default: return "#D8CCB4";
  }
}

function buildingColor(p: Parcel): string {
  if (p.owner === "speculator") return "#9A3A2B";
  if (p.owner === "land-trust" || p.type === "land-trust") return "#2F6F4F";
  switch (p.type) {
    case "single-family": return "#C68445";
    case "two-flat": return "#B96A3C";
    case "three-flat": return "#A95E3A";
    case "courtyard": return "#8F593D";
    case "tower": return "#777A7E";
    case "rehab-tower": return "#6C9B78";
    case "commercial": return "#C45D3E";
    case "industrial": return "#5F5C55";
    case "school": return "#A5432A";
    case "church": return "#D6BD8F";
    case "library": return "#8B6B38";
    case "clinic": return "#A74333";
    case "transit": return "#B73B33";
    case "mural": return "#D97855";
    default: return "#B48355";
  }
}

function buildingHeight(p: Parcel): number {
  switch (p.type) {
    case "single-family": return 0.42;
    case "two-flat": return 0.62;
    case "three-flat": return 0.82;
    case "courtyard": return 0.72;
    case "tower": return 2.7;
    case "rehab-tower": return 2.35;
    case "commercial": return 0.55;
    case "industrial": return 0.45;
    case "school": return 0.62;
    case "church": return 0.75;
    case "library": return 0.58;
    case "clinic": return 0.62;
    case "transit": return 0.5;
    case "land-trust": return 0.52;
    case "mural": return 0.48;
    default: return 0;
  }
}

function footprint(p: Parcel): { w: number; d: number } {
  switch (p.type) {
    case "tower": return { w: 0.43, d: 0.43 };
    case "rehab-tower": return { w: 0.48, d: 0.48 };
    case "industrial": return { w: 0.78, d: 0.7 };
    case "school": return { w: 0.76, d: 0.62 };
    case "courtyard": return { w: 0.76, d: 0.7 };
    case "commercial": return { w: 0.72, d: 0.55 };
    case "transit": return { w: 0.72, d: 0.42 };
    case "church": return { w: 0.52, d: 0.58 };
    default: return { w: 0.58, d: 0.52 };
  }
}

function parcelPosition(p: Pick<Parcel, "col" | "row">): THREE.Vector3 {
  return new THREE.Vector3(p.col - (COLS - 1) / 2, 0, p.row - (ROWS - 1) / 2);
}

function makeMaterial(color: string, opacity = 1, roughness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.03,
    transparent: opacity < 1,
    opacity,
  });
}

function addParcelUserData(obj: THREE.Object3D, parcel: Parcel) {
  obj.userData.parcelId = parcel.id;
  for (const child of obj.children) addParcelUserData(child, parcel);
}

function addTrees(group: THREE.Group, p: Parcel, count: number, lush = false) {
  const base = parcelPosition(p);
  for (let i = 0; i < count; i++) {
    const ox = ((i % 3) - 1) * 0.22;
    const oz = (Math.floor(i / 3) - 0.5) * 0.24;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.18, 7),
      makeMaterial("#6F4A24")
    );
    trunk.position.set(base.x + ox, 0.18, base.z + oz);
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(lush ? 0.15 : 0.12, 12, 8),
      makeMaterial(lush ? "#3F8B43" : "#2F6F34")
    );
    crown.position.set(base.x + ox, 0.36, base.z + oz);
    group.add(trunk, crown);
  }
}

function addParcel(scene: THREE.Group, parcel: Parcel, highlighted: boolean, filteredIn: boolean) {
  const opacity = filteredIn ? 1 : 0.18;
  const pos = parcelPosition(parcel);
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.08, 0.94),
    makeMaterial(holcColor(parcel), opacity)
  );
  tile.position.set(pos.x, 0.02, pos.z);
  addParcelUserData(tile, parcel);
  scene.add(tile);

  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.035, 1.0),
    makeMaterial("#756B5F", filteredIn ? 0.72 : 0.12)
  );
  curb.position.set(pos.x, -0.035, pos.z);
  scene.add(curb);

  if (parcel.type === "park" || parcel.type === "community-garden") {
    const grass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.045, 6),
      makeMaterial(parcel.type === "park" ? "#5EA65B" : "#6FB35C", opacity)
    );
    grass.rotation.y = Math.PI / 6;
    grass.position.set(pos.x, 0.095, pos.z);
    addParcelUserData(grass, parcel);
    scene.add(grass);
    addTrees(scene, parcel, parcel.type === "park" ? 6 : 4, true);
  } else if (parcel.type === "expressway") {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.06, 1.08),
      makeMaterial("#262626", opacity)
    );
    road.position.set(pos.x, 0.12, pos.z);
    addParcelUserData(road, parcel);
    scene.add(road);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.064, 0.82),
      makeMaterial("#F5F0E8", filteredIn ? 0.75 : 0.12)
    );
    stripe.position.set(pos.x, 0.16, pos.z);
    scene.add(stripe);
  } else {
    const h = buildingHeight(parcel);
    if (h > 0) {
      const fp = footprint(parcel);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(fp.w, h, fp.d),
        makeMaterial(buildingColor(parcel), opacity, 0.74)
      );
      body.position.set(pos.x, 0.08 + h / 2, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      addParcelUserData(body, parcel);
      scene.add(body);

      const roofColor = parcel.type === "tower" || parcel.type === "rehab-tower" ? "#343536" : "#5E3117";
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(fp.w + 0.04, 0.07, fp.d + 0.04),
        makeMaterial(roofColor, opacity)
      );
      roof.position.set(pos.x, 0.12 + h, pos.z);
      addParcelUserData(roof, parcel);
      scene.add(roof);

      if (parcel.type === "church") {
        const steeple = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.45, 4),
          makeMaterial("#5E3117", opacity)
        );
        steeple.position.set(pos.x, 0.38 + h, pos.z - 0.03);
        steeple.rotation.y = Math.PI / 4;
        addParcelUserData(steeple, parcel);
        scene.add(steeple);
      }

      if (parcel.type === "transit") {
        const canopy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.11, 24, 1, false, 0, Math.PI),
          makeMaterial("#7A1C14", opacity)
        );
        canopy.rotation.z = Math.PI / 2;
        canopy.position.set(pos.x, 0.74, pos.z);
        addParcelUserData(canopy, parcel);
        scene.add(canopy);
      }
    }
  }

  if (parcel.protected || parcel.owner === "land-trust") {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.018, 8, 44),
      makeMaterial("#1B3A2D", filteredIn ? 0.9 : 0.18)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pos.x, 0.13, pos.z);
    scene.add(ring);
  }

  if (isAtRisk(parcel)) {
    const risk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.055, 16),
      makeMaterial("#C45D3E", filteredIn ? 0.95 : 0.2)
    );
    risk.position.set(pos.x + 0.32, 0.18, pos.z - 0.32);
    scene.add(risk);
  }

  if (highlighted) {
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.026, 8, 64),
      makeMaterial("#E0A94A", 0.96, 0.5)
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.set(pos.x, 0.2, pos.z);
    scene.add(glow);
  }
}

function addLake(scene: THREE.Group) {
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.04, ROWS + 1.4),
    makeMaterial("#4A8FA3", 0.92, 0.5)
  );
  water.position.set(COLS / 2 + 1.5, -0.045, 0);
  scene.add(water);

  for (let i = 0; i < 10; i++) {
    const wave = new THREE.Mesh(
      new THREE.BoxGeometry(1.1 + (i % 3) * 0.25, 0.012, 0.025),
      makeMaterial("#D8EEF2", 0.55)
    );
    wave.position.set(COLS / 2 + 0.35 + (i % 3) * 0.7, 0.0, -3.1 + i * 0.68);
    wave.rotation.y = i % 2 === 0 ? 0.12 : -0.08;
    scene.add(wave);
  }
}

export default function ParcelMap3D({ parcels, highlight, onHover, onClick }: ParcelMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const highSet = useMemo(() => new Set(highlight ?? []), [highlight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.dataset.testid = "parcel-map-3d-canvas";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F5F0E8");
    scene.fog = new THREE.Fog("#F5F0E8", 10, 22);

    const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 80);
    camera.position.set(7.6, 8.2, 9.6);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1.1;
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.62;
    controls.maxZoom = 2.6;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.25;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#FFF7E6", "#6B705C", 2.2));
    const sun = new THREE.DirectionalLight("#FFF0D0", 3.1);
    sun.position.set(-4, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const ward = new THREE.Group();
    scene.add(ward);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(COLS + 0.9, 0.08, ROWS + 0.9),
      makeMaterial("#756B5F", 1)
    );
    base.position.set(0, -0.08, 0);
    base.receiveShadow = true;
    ward.add(base);
    addLake(ward);

    for (const parcel of parcels) {
      addParcel(ward, parcel, highSet.has(parcel.id), isFilteredIn(parcel, filter));
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: number | null = null;
    let frame = 0;

    function resize() {
      const rect = container.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(360, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const frustum = 8.2;
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
    }

    function parcelFromObject(obj: THREE.Object3D | null): Parcel | null {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (typeof cur.userData.parcelId === "number") {
          return parcels.find((p) => p.id === cur?.userData.parcelId) ?? null;
        }
        cur = cur.parent;
      }
      return null;
    }

    function handlePointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(ward.children, true)[0];
      const parcel = parcelFromObject(hit?.object ?? null);
      if ((parcel?.id ?? null) !== hoveredId) {
        hoveredId = parcel?.id ?? null;
        onHover?.(parcel);
      }
    }

    function handlePointerLeave() {
      hoveredId = null;
      onHover?.(null);
    }

    function handleClick() {
      if (hoveredId == null) return;
      const parcel = parcels.find((p) => p.id === hoveredId);
      if (parcel) onClick?.(parcel);
    }

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("click", handleClick);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    function animate() {
      frame = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [filter, highSet, onClick, onHover, parcels]);

  function zoom(multiplier: number) {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.zoom = clamp(camera.zoom * multiplier, 0.62, 2.6);
    camera.updateProjectionMatrix();
    controlsRef.current?.update();
  }

  function resetCamera() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(7.6, 8.2, 9.6);
    camera.zoom = 1.1;
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function rotateView() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-cream-dark/30 px-3 py-2">
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">Show</span>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                filter === f.key ? "bg-forest text-cream" : "bg-cream text-warm-gray hover:bg-cream"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[440px] w-full overflow-hidden rounded-md border border-border bg-cream shadow-sm md:h-[540px]" data-testid="parcel-map-3d">
        <div className="absolute left-2 top-2 z-10 rounded-sm bg-cream/90 px-2.5 py-1 shadow-sm">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">Parkhaven 3D</p>
        </div>

        <div className="absolute right-2 top-2 z-10 flex gap-1">
          <IconButton label="Zoom in" onClick={() => zoom(1.14)}>
            <ZoomIn size={15} />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => zoom(1 / 1.14)}>
            <ZoomOut size={15} />
          </IconButton>
          <IconButton label="Rotate view" onClick={rotateView}>
            <RotateCcw size={15} />
          </IconButton>
          <IconButton label="Reset view" onClick={resetCamera}>
            <Home size={15} />
          </IconButton>
        </div>

        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-cream/90 text-forest shadow-sm transition-colors hover:bg-cream-dark"
    >
      {children}
    </button>
  );
}
