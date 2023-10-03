
import Particle from "./Particle";

export default function Particles ({size}) {

    const elements = [];

    for (let i=0; i< size; i++) {
        elements.push(<Particle />)
    };

    return (
    <div className="particles">
        {elements.map( p => p)}
    </div>)
}
