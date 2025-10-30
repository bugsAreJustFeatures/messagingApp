// import styling from css module
import styles from "./HomePage.module.css";

export default function HomePage() {   
    return (

        <div className="pageWrapper">
            <div id={styles.homeWrapper}>
                <p>Welcome to ouiMessage.</p>

                <p>A place where oui can all message each other and have a great time.</p>

                <p>No charges. No delays. No worries.</p>

                <p>oui have got everything you would want to keep in touch with friends and family.</p>
            </div>
        </div>
    )
};