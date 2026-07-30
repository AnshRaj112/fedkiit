"use client";


import { useEffect } from "react";

import errorImage from "../../assets/images/errorPage.jpg";
import styles from "./styles/Error.module.scss";
import { useRouter } from "next/navigation";

function Error() {
  const router = useRouter();

  // Ran during render in the Vite app, which only ever executed in a browser.
  // Under Next.js this also runs on the server, where `window` is undefined.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleReturnToHome = () => {
    router.push('/');
  };

  return (
    <div className={styles.errorImage}>
      <div className={styles.box}>
      <img src={errorImage.src} alt="Error Page" />
      <p>The webpage you are looking for is currently under maintainence. Please try again later. If the problem continues, mail us at fedkiit@gmail.com
      </p>
      <button onClick={handleReturnToHome}>Return To Home</button>
      </div>
    </div>
  );
}

export default Error;


