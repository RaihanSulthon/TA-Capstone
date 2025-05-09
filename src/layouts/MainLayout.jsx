import {Outlet} from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout =() => {
    return(
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar/>
            <main className="container mx-auto py-8 px-4 mt-4 flex-grow">
                <Outlet/>
            </main>
        </div>
    );
};

export default MainLayout;