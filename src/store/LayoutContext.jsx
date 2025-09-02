import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const LayoutContext = createContext();
export const useLayout = () => useContext(LayoutContext);

// Default canvas sections
const defaultSections = [
  { id: "sec-header", name: "Header", elementIds: [] },
  { id: "sec-main", name: "Main", elementIds: [] },
  { id: "sec-footer", name: "Footer", elementIds: [] },
];

export const LayoutProvider = ({ children }) => {
  const [sections, setSections] = useState(defaultSections);
  const [elements, setElements] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  // 🔹 Temporary static userId (later replace with logged in user)
  const userId = "123";

  // ✅ Load layout on first render
  useEffect(() => {
    axios
      .get(`https://websites-backend-jobk.vercel.app/api/layout/${userId}`)
      .then((res) => {
        if (res.data?.sections) setSections(res.data.sections);
        if (res.data?.elements) setElements(res.data.elements);
      })
      .catch((err) => {
        console.warn("⚠️ Could not load layout from backend:", err.message);
      });
  }, []);

  // ✅ Save layout to backend
  const saveLayout = async () => {
    try {
      const res = await axios.post(
        `https://websites-backend-jobk.vercel.app/api/layout/${userId}`,
        { sections, elements }
      );
      console.log("✅ Layout saved:", res.data);
    } catch (err) {
      console.error("❌ Save failed:", err.message);
    }
  };

  return (
    <LayoutContext.Provider
      value={{
        sections,
        setSections,
        elements,
        setElements,
        selectedId,
        setSelectedId,
        saveLayout,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
