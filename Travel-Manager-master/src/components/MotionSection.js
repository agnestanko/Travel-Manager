import { motion } from "framer-motion";

function MotionSection({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: 0.65,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}

export default MotionSection;