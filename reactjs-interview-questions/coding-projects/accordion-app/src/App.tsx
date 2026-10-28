import Accordion from "./components/Accordion"
import { faqData } from "./data/faqData"
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <div className="container">
        <h1>Frequently asked questions and answers</h1>
        <p className="subtitle">
          Commonly asked React questions and answers
        </p>

        <Accordion
          items={faqData}
          allowMultiple>
        </Accordion>
      </div>
    </div>
  )
}