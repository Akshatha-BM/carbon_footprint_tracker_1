import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import "./common/Tailwind.css";
import { FaQuestionCircle } from "react-icons/fa";

export const Flight = () => {
  const [flightClass, setFlightClass] = useState("economy"); // Default to economy class
  const [flightHours, setFlightHours] = useState("");
  const [username, setUsername] = useState("");
  const [tooltipVisible1,setTooltipVisible1]=useState(false);
  const [flightCarbonFootprint, setFlightCarbonFootprint] = useState(null);

  const navigate = useNavigate();

  const handleFlightClassChange = (value) => {
    setFlightClass(value);
  };

  const toggleTooltip1 = () => {
    setTooltipVisible1(!tooltipVisible1);
  };

  const handleFlightHoursChange = (value) => {
    if (parseFloat(value) < 0) {
      alert("Flight hours cannot be negative");
    } else {
      setFlightHours(value);
    }
  };

  const saveFlightDetails = async () => {
    const totalFootprint = calculateFlightCarbonFootprint(
      flightClass,
      parseFloat(flightHours)
    );

    const db = getFirestore();
    const usersCollection = collection(db, "users");
    const userEmail = sessionStorage.getItem("User Email");
    const userQuery = query(usersCollection, where("email", "==", userEmail));

    try {
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUsername(userDoc.id || "");

        const userDocRef = doc(usersCollection, userDoc.id);

        // Include year in the current month
        const currentDate = new Date();
        const currentMonthYear = currentDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        const currentMonthRef = collection(userDocRef, currentMonthYear);

        // Use consumptionFlight as the document id
        const consumptionFlightRef = doc(currentMonthRef, "consumptionFlight");

        const newFlightDetails = {
          flightClass,
          flightHours: parseFloat(flightHours),
          flightCarbonFootprint: totalFootprint,
          timestamp: new Date().toISOString(),
        };

        try {
          await setDoc(consumptionFlightRef, newFlightDetails);
          setFlightCarbonFootprint(totalFootprint);
          
          await calculateAndStoreTotal(
            currentMonthRef,
            currentMonthYear,
            userDocRef
          );
          //          navigate('/home');
        } catch (error) {
          
          alert(error.message);
        }
      } else {
        
        alert("User not found in Firestore");
      }
    } catch (error) {
      
      alert("Error fetching user data:", error.message);
    }
  };

  const calculateAndStoreTotal = async (
    currentMonthRef,
    currentMonthYear,
    userDocRef
  ) => {
    const totalDocRef = collection(userDocRef, "Total");
    const totalMYDocRef = doc(totalDocRef, currentMonthYear);

    const querySnapshot = await getDocs(currentMonthRef);

    let totalHome = 0;
    let totalFood = 0;
    let totalVehicle = 0;
    let totalFlight = 0;
    let totalPublicVehicle = 0;
    let totalExpenditure = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalHome += data.homeCarbonFootprint || 0;
      totalFood += data.foodCarbonFootprint || 0;
      totalVehicle += data.vehicleCarbonFootprint || 0;
      totalFlight += data.flightCarbonFootprint || 0;
      totalPublicVehicle += data.PublicVehicleCarbonFootprint || 0;
      totalExpenditure += data.ExpenditureCarbonFootprint || 0;
    });

    const totalDocData = {
      totalHome,
      totalFood,
      totalVehicle,
      totalFlight,
      totalPublicVehicle,
      totalExpenditure,
      totalCarbonFootprint:
        totalHome +
        totalFood +
        totalVehicle +
        totalFlight +
        totalPublicVehicle +
        totalExpenditure,
      timestamp: new Date(),
    };

    try {
      await setDoc(totalMYDocRef, totalDocData);
      
    } catch (error) {
      
      alert(error.message);
    }
  };

  // Function to calculate flight carbon footprint based on class and hours
  const calculateFlightCarbonFootprint = (classType, hours) => {
    switch (classType) {
      case "economy":
        return 90 * hours;
      case "business":
        return 270 * hours;
      case "first":
        return 810 * hours;
      default:
        return 0;
    }
  };

  return (
    <div className="w-[90%] flex flex-col items-center py-10 mx-[5vw]">
      <div className="w-full pt-5 text:black bg-white font-extrabold text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl text-center z-10">
        Flight Details
      </div>

      <div className="flex flex-row items-center flex-wrap bg-white w-full h-[90%]">
        <p className="w-full pt-5 text:black bg-white  sm:text-xl md:text-xl lg:text-xl xl:text-xl 2xl:text-xl text-center">
                Note: Please fill in the details once a month
                <FaQuestionCircle className="mx-auto"
                  onMouseEnter={toggleTooltip1}
                  onMouseLeave={toggleTooltip1}
                />
                {tooltipVisible1 && (
                  <div className="bg-white p-2 rounded shadow-lg z-10">
                    <div className="flex flex-col z-10">
                      <p className="text-xs">If you wish to update some values in the current month then you will have to update all the fields in the current screen.</p>
                    </div>
                  </div>
                )}
          </p>
        <div className="flex items-center flex-col w-full h-full lg:w-1/2 lg:mt-[1%] space-y-0 py-20">
          <div className="flex flex-wrap flex-row items-center mb-4">
            <span htmlFor="flightClass" className="mr-2 font-medium">
              Flight Class:
            </span>

            <select
              id="flightClass"
              value={flightClass}
              className="block rounded-sm bg-white px-2 py-2 text-sm font-medium border border-gray-300 focus:outline-none focus:border-blue-500"
              onChange={(e) => handleFlightClassChange(e.target.value)}
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div className="flex flex-row items-center justify-center mb-4">
            <span className="mr-2 font-medium">Flight Hours:</span>
            <label className="relative block w-1/2 sm:w-auto rounded-md border border-gray-200 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 flex flex-row flex-col items-center ml-2">
              <input
                type="number"
                value={flightHours}
                placeholder="In hrs"
                className="block w-full border-0 rounded-sm bg-white px-2 py-2 text-sm font-medium group-hover:bg-transparent"
                onChange={(e) => handleFlightHoursChange(e.target.value)}
              />
            </label>
          </div>

          <br />

          <button type="button" onClick={saveFlightDetails}>
            <a className="group inline-block rounded bg-gradient-to-r from-yellow-300 via-lime-300 to-green-300 p-[2px] hover:text-white focus:outline-none focus:ring active:text-opacity-75">
              <span className="block rounded-sm bg-white px-8 py-3 text-sm font-medium group-hover:bg-transparent">
                Calculate
              </span>
            </a>
          </button>

          <br />

          <div>
            {flightCarbonFootprint !== null && (
              <div className="text-xl font-bold mb-4">
                <p>Total Flight Carbon Footprint:</p>
                <p>{flightCarbonFootprint.toFixed(3)} KgCO2</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex lg:h-full w-0 lg:w-1/2 px-10 py-10">
          <img className="object-contain" src={require("../assets/flights.jpg")}/>
        </div>
      </div>
    </div>
  );
};

export default Flight;
