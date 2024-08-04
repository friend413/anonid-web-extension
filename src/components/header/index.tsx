import logo from '@assets/img/logo.png';

const Header = () => {
    return (
        <div className="logo flex gap-x-[22px] h-[80px] w-[100%]">
            <img src={logo} alt="Navigation Logo"/>
            <span className="h-[80px] flex flex-col items-center justify-center text-white align-middle">
                <h1 className="text-5xl">ANON ID</h1>
            </span>
        </div>
    )
}

export default Header;