import { LayoutProvider } from "./store/LayoutContext";
import DragDropBuilderApp from "./DragDropBuilderApp";

export default function App() {
  return (
    <LayoutProvider>
      <DragDropBuilderApp />
    </LayoutProvider>
  );
}
