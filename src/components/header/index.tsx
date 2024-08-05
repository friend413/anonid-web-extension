import logo from '@assets/img/logo.png';

const Header = () => {
    return (
        <div className="logo flex h-[90px] w-[100%] justify-center">
            <img src={logo} alt="Navigation Logo"/>
        </div>
    )
}

export default Header;