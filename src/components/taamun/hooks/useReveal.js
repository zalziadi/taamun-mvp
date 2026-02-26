import { useRef, useState } from "react";

export default function useReveal() {
  const ref = useRef(null);
  const [visible] = useState(true);

  return [ref, visible];
}
