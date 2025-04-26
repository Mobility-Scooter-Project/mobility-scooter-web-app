import { useEffect, useState } from "react";

/**
 * A custom React hook that determines if a component has mounted in the browser.
 * This is useful for handling client-side only functionality and avoiding hydration mismatches.
 * 
 * @returns {boolean} A boolean indicating whether the component has mounted (true) or not (false)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasMounted = useHasMounted();
 *   
 *   if (!hasMounted) {
 *     return null; // Or loading state
 *   }
 *   
 *   return <div>Component is mounted</div>;
 * }
 * ```
 */
const useHasMounted = () => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasMounted(true);
            console.log("Component has mounted");
        }
    }, []);

    return hasMounted;
}

export default useHasMounted;