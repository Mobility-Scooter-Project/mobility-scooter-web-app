import { useEffect, useState } from "react";

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