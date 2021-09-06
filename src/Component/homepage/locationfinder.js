import React, { useState }  from "react"
import "./locationfinder.css"
import {useHistory } from 'react-router-dom'
import axios from "axios";

const Locationfinder =({user}) => {
    const history = useHistory();
    const [findlocn, setUser] = useState({
        distn:1,
        city:"",
        unit:"km",
        user:user
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setUser({
            ...findlocn,
            [name]: value
        })
    }

    const locationfinder=async ()=>{  
        await axios.post("http://localhost:3400/locationfinder",findlocn).then(res=>{
            // res.data.cities
            alert(res.data.cities)
        })
    }

    const homepage=()=>{  
        history.push("/")
    }

    return (
        <div>
            <form>
                <label htmlFor='city'>City:</label>
                <input type="text" onChange={handleChange} name="city" value={findlocn.city} id="distn" placeholder="By default your registered city" className="locationinput"/>
                
                <label htmlFor='distn'>Distance:</label>
                <input type="text" onChange={handleChange} name="distn" value={Number(findlocn.distn)} id="distn" placeholder="Distance" className="locationinput"/>
                
                <label htmlFor='km' className='reigsterlabelgen'>Unit:</label>
                <input type='radio' className='locationlabel' id='km' name='unit' value="km" onChange={handleChange} />
                <label htmlFor='km' className='reigsterlabelgen'>km</label>
                <input type='radio' className='locationlabel' id='mi' name='unit' value="mi" onChange={handleChange} />
                <label htmlFor='mi' className='reigsterlabelgen'>mi</label>
                
                <div className="btndiv">
                    <button className="findbtn" onClick={locationfinder}>Go</button>
                    <button className="findbtn" onClick={homepage}>Back</button>
                </div>
            </form>
        </div>
    );

}

export default Locationfinder;
    