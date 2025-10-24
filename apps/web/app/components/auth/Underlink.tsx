import { Link } from "react-router";
import { Button } from "../Button";

function Underlink() {
  return (
    <Button className="text-label" variant={"link"} size={"none"}>
      <Link to={"/"}>Have an account? Sign in here.</Link>
    </Button>
  );
}

export default Underlink;
