import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuid } from "uuid";
import { useLayout } from "./store/LayoutContext";

// ----------- Sortable Wrapper -----------
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="rounded-lg p-3 bg-white shadow cursor-grab"
    >
      {children}
    </div>
  );
}

// ----------- Toolbox (Palette) -----------
function Toolbox() {
  const items = [
    { type: "text", label: "Text" },
    { type: "image", label: "Image" },
    { type: "button", label: "Button" },
  ];

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow">
      <h2 className="font-semibold mb-2">Elements</h2>
      {items.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData(
              "application/x-builder",
              JSON.stringify({ type: item.type })
            )
          }
          className="p-2 mb-2 bg-white rounded shadow cursor-grab"
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ----------- Renderer for Elements -----------
// ----------- Renderer for Elements -----------
export function ElementRenderer({ el }) {
  const { setElements } = useLayout();  

  // 👉 local state maintain karo text ke liye
  const [text, setText] = useState(el.content || "Editable text");

  if (el.type === "text") {
    return (
      <div
        contentEditable
        suppressContentEditableWarning={true}
        style={{
          fontSize: el.size || 18,
          color: el.color || "#111",
          cursor: "text",
        }}
        onFocus={(e) => {
          if (text === "Editable text") {
            setText(""); // placeholder hatao
          }
        }}
        onInput={(e) => {
          const newValue = e.currentTarget.innerText;
          setText(newValue); // local state update

          // global state (context) update
          setElements((prev) => ({
            ...prev,
            [el.id]: {
              ...prev[el.id],
              content: newValue,
            },
          }));
        }}
      >
        {text}
      </div>
    );
  }

  if (el.type === "image") {
    return (
      <div className="flex flex-col items-start">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setElements((prev) => ({
                  ...prev,
                  [el.id]: { ...prev[el.id], src: reader.result },
                }));
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <img
          src={el.src || "https://picsum.photos/300"}
          alt="placeholder"
          className="max-w-full rounded w-64 h-64 object-cover mt-2"
        />
      </div>
    );
  }

  if (el.type === "button") {
    return (
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer duration-300">
        {el.label || "Click"}
      </button>
    );
  }

  return <div>Unknown element</div>;
}



// ----------- Section -----------
function Section({ section }) {
  const sensors = useSensors(useSensor(PointerSensor));
  const { elements, setElements, setSections } = useLayout();
  const items = section.elementIds.map((id) => elements[id]).filter(Boolean);

  const handleDropFromPalette = (e) => {
    const data = e.dataTransfer.getData("application/x-builder");
    if (data) {
      const payload = JSON.parse(data);
      const id = uuid();
      const newEl = { id, type: payload.type };

      setElements((prev) => ({ ...prev, [id]: newEl }));
      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id
            ? { ...s, elementIds: [...s.elementIds, id] }
            : s
        )
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over) return;
        const oldIndex = items.findIndex((el) => el.id === active.id);
        const newIndex = items.findIndex((el) => el.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setSections((prev) =>
            prev.map((s) =>
              s.id === section.id
                ? {
                    ...s,
                    elementIds: arrayMove(s.elementIds, oldIndex, newIndex),
                  }
                : s
            )
          );
        }
      }}
    >
      <div
        className="min-h-[120px] p-4 border-2 border-dashed rounded-lg bg-gray-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropFromPalette}
      >
        <SortableContext
          items={items.map((el) => el.id)}
          strategy={rectSortingStrategy}
        >
          {items.length === 0 && (
            <div className="text-gray-400">Drop elements here…</div>
          )}
          {items.map((el) => (
            <SortableItem key={el.id} id={el.id}>
              <ElementRenderer el={el} />
            </SortableItem>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

// ----------- Main App -----------
export default function DragDropBuilderApp() {
  const { sections, saveLayout } = useLayout();

  return (
    <div className="min-h-screen bg-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Website Builder Prototype</h1>
        <button
          onClick={saveLayout}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer duration-300 aniam "
        >
          Save Layout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside>
          <Toolbox />
        </aside>

        <main className="md:col-span-3 space-y-6">
          {sections.map((s) => (
            <div key={s.id}>
              <h2 className="font-semibold mb-2">{s.name}</h2>
              <Section section={s} />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
