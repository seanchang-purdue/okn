type MaterialMoonIconProps = {
  className?: string;
};

const MaterialMoonIcon: React.FC<MaterialMoonIconProps> = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className={className}><path fill="currentColor" d="M14 22q-2.075 0-3.9-.788t-3.175-2.137T4.788 15.9T4 12t.788-3.9t2.137-3.175T10.1 2.788T14 2q.875 0 1.75.175t1.675.525q.3.125.45.387t.15.538q0 .225-.088.425t-.287.35q-1.75 1.375-2.7 3.375T14 12q0 2.25.925 4.25t2.7 3.35q.2.15.288.363T18 20.4q0 .275-.15.538t-.45.387q-.8.35-1.662.513T14 22m0-2h.525q.25 0 .475-.05q-1.425-1.65-2.212-3.687T12 12t.788-4.262T15 4.05Q14.775 4 14.525 4H14q-3.325 0-5.663 2.338T6 12t2.338 5.663T14 20m-2-8"/></svg>

  )
};

export default MaterialMoonIcon