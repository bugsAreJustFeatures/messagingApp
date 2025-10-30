
import styles from "./ContactPage.module.css";

export default function ContactPage() {

    return (
        <div className="pageWrapper">

            <div id={styles.contactPageWrapper}>

                <p>
                    Email: hrobertson.contact@gmail.com
                </p>
                
                <p>
                    GitHub: https://github.com/bugsAreJustFeatures
                </p>

                <p>
                    See you there
                </p>

            </div>
        </div>
    )
};