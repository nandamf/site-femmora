import React, { useState, useEffect } from "react";

const MESSAGES = [
  "Frete Grátis acima de R$ 199",
  "Parcele em até 6x sem juros",
  "Embalagem especial para presente em todos os pedidos",
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-bordeaux text-alabaster text-center text-[11px] md:text-xs tracking-[0.2em] uppercase py-2.5 px-4">
      {MESSAGES[index]}
    </div>
  );
}