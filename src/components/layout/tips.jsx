"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tipsData = [
  {
    id: 1,
    title: "Include clear photos and detailed descriptions",
    details:
      "Sharp, multi-angle photos. Add color, size, brand, and unique marks.",
  },
  {
    id: 2,
    title: "Specify exact location where item was lost/found",
    details:
      "Mention nearby landmarks or room numbers to make it super clear.",
  },
  {
    id: 3,
    title: "Respond quickly to messages and claims",
    details:
      "Be active! Fast responses increase chances of reunion.",
  },
  {
    id: 4,
    title: "Mark items as resolved when found/returned",
    details:
      "Update your post to help keep the platform clean and useful.",
  },
];

export default function TipsForSuccess() {
  const [expandedTip, setExpandedTip] = useState(null);

  const toggleExpand = (id) => {
    setExpandedTip(expandedTip === id ? null : id);
  };

  return (
 
    <div className=" mx-auto p-6 bg-black text-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Tips for Success</h2>
      <ul className="space-y-4">
        {tipsData.map(({ id, title, details }) => (
          <li
            key={id}
            onClick={() => toggleExpand(id)}
            className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium">{title}</h3>
            </div>
            <AnimatePresence>
              {expandedTip === id && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 text-sm text-gray-300"
                >
                  {details}
                </motion.p>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
}
