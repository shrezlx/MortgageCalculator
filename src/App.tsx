import React, { useEffect, useState } from "react";
import "./App.css";

interface PaymentRow {
  month: number;
  payment: string;
  principalPaid: string;
  interestPaid: string;
  remainingBalance: string;
}

const calculateMortgageSchedule = (
  principal: number,
  apr: number,
  termYears: number,
  termMonths: number,
  extraMonthlyPayment: number,
  yearlyExtraPayment: number
) => {
  const monthlyInterestRate = apr / 100 / 12;
  const totalMonths = termYears * 12 + termMonths;
  const baseMonthlyPayment =
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalMonths));

  const MAX_MONTHS = 1000 * 12;

  let balance = principal;
  let schedule: PaymentRow[] = [];
  let totalInterestPaid = 0;
  let months = 0;
  let originalMonths = totalMonths;

  while (balance > 0 && months < MAX_MONTHS) {
    months++;
    let interestPaid = balance * monthlyInterestRate;
    let principalPaid = baseMonthlyPayment + extraMonthlyPayment - interestPaid;

    if (months % 12 === 1) {
      principalPaid += yearlyExtraPayment;
    }

    if (principalPaid > balance) {
      principalPaid = balance;
    }

    balance -= principalPaid;
    totalInterestPaid += interestPaid;

    schedule.push({
      month: months,
      payment: (baseMonthlyPayment + extraMonthlyPayment).toFixed(2),
      principalPaid: principalPaid.toFixed(2),
      interestPaid: interestPaid.toFixed(2),
      remainingBalance: balance.toFixed(2),
    });

    if (balance <= 0) break;
  }

  const timeSavedMonths = originalMonths - months;
  const interestSaved = baseMonthlyPayment * totalMonths - principal - totalInterestPaid;

  return { schedule, totalInterestPaid, timeSavedMonths, interestSaved };
};

const MortgageCalculatorApp: React.FC = () => {
  const [principal, setPrincipal] = useState("");
  const [apr, setAPR] = useState("");
  const [termYears, setTermYears] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [monthlyExtra, setMonthlyExtra] = useState("");
  const [yearlyExtra, setYearlyExtra] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentRow[]>([]);
  const [totalInterest, setTotalInterest] = useState(0);
  const [timeSaved, setTimeSaved] = useState(0);
  const [interestSaved, setInterestSaved] = useState(0);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1]));
  const [showResults, setShowResults] = useState(false);

  // Reset to defaults on first load only
  useEffect(() => {
    setPrincipal("");
    setAPR("");
    setTermYears("");
    setTermMonths("");
    setMonthlyExtra("");
    setYearlyExtra("");
    setPaymentSchedule([]);
    setTotalInterest(0);
    setTimeSaved(0);
    setInterestSaved(0);
    setExpandedYears(new Set([1]));
    setShowResults(false);
  }, []);

  const handleCalculate = () => {
    // Validate required fields: principal, apr, and at least one of termYears or termMonths
    if (
      parseFloat(principal) <= 0 ||
      parseFloat(apr) <= 0 ||
      (parseInt(termYears) <= 0 && parseInt(termMonths) <= 0)
    ) {
      alert("Please enter Principal, APR, and at least Term Years or Term Months.");
      return;
    }

    const { schedule, totalInterestPaid, timeSavedMonths, interestSaved } = calculateMortgageSchedule(
      parseFloat(principal),
      parseFloat(apr),
      parseInt(termYears),
      parseInt(termMonths),
       parseFloat(monthlyExtra),
       parseFloat(yearlyExtra)
    );
    setPaymentSchedule(schedule);
    setTotalInterest(totalInterestPaid);
    setTimeSaved(timeSavedMonths);
    setInterestSaved(interestSaved);
    setShowResults(true);
  };

  const toggleYear = (year: number) => {
    const updated = new Set(expandedYears);
    if (updated.has(year)) {
      updated.delete(year);
    } else {
      updated.add(year);
    }
    setExpandedYears(updated);
  };

  const handleGoBack = () => {
    setShowResults(false);
  };

  return (
    <div className="container">
      {!showResults ? (
        <>
          <h1>Mortgage Calculator</h1>

          <label>Principal:</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />

          <label>APR (%):</label>
          <input
            type="number"
            step="0.01"
            value={apr}
            onChange={(e) => setAPR(e.target.value)}
          />

          <label>Term (Years):</label>
          <input
            type="number"
            value={termYears}
            onChange={(e) => setTermYears(e.target.value)}
          />

          <label>Term (Months):</label>
          <input
            type="number"
            value={termMonths}
            min={0}
            max={11}
            onChange={(e) => {
              let val = (e.target.value);
              if (parseInt(val) > 11) {
                alert("Month value cannot exceed 11.");
                val = "0";
              }
              if (parseInt(val) < 0) val = "0";
              setTermMonths(val);
            }}
          />

          <label>Monthly Extra Payment:</label>
          <input
            type="number"
            value={monthlyExtra}
            onChange={(e) => setMonthlyExtra(e.target.value)}
          />

          <label>Yearly Extra Payment:</label>
          <input
            type="number"
            value={yearlyExtra}
            onChange={(e) => {
              const val = (e.target.value);
              console.log("Yearly Extra Payment changed to:", val);
              setYearlyExtra(val);
            }}
          />

          <button onClick={handleCalculate}>Calculate</button>
        </>
      ) : (
        <>
          <h2>Payment Schedule</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Payment</th>
                  <th>Principal Paid</th>
                  <th>Interest Paid</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const grouped: { [year: number]: PaymentRow[] } = {};
                  paymentSchedule.forEach((row) => {
                    const year = Math.floor((row.month - 1) / 12) + 1;
                    if (!grouped[year]) grouped[year] = [];
                    grouped[year].push(row);
                  });

                  return Object.entries(grouped).map(([yearStr, rows]) => {
                    const year = Number(yearStr);
                    const isExpanded = expandedYears.has(year);

                    return (
                      <React.Fragment key={year}>
                        {rows.map((row, idx) => {
                          const isFirstMonth = idx === 0;
                          if (!isExpanded && !isFirstMonth) return null;

                          return (
                            <tr key={`${year}-${idx}`}>
                              <td
                                style={{
                                  cursor: isFirstMonth ? "pointer" : "default",
                                  fontWeight: isFirstMonth ? "bold" : "normal",
                                  backgroundColor: isFirstMonth ? "#f0f0f0" : undefined,
                                  userSelect: isFirstMonth ? "none" : undefined,
                                  minWidth: "80px",
                                }}
                                onClick={isFirstMonth ? () => toggleYear(year) : undefined}
                                title={isFirstMonth ? "Click to toggle year" : undefined}
                              >
                                {isFirstMonth
                                  ? `Year ${year} ${isExpanded ? "▲" : "▼"} - Month ${row.month % 12 || 12}`
                                  : `Month ${row.month % 12 || 12}`}
                              </td>
                              <td>${row.payment}</td>
                              <td>${row.principalPaid}</td>
                              <td>${row.interestPaid}</td>
                              <td>${row.remainingBalance}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          <div className="savings">
            <h2>Summary</h2>
            <p><strong>Total Interest Paid:</strong> ${totalInterest.toFixed(2)}</p>
            <p><strong>Time Saved:</strong> {Math.floor(timeSaved / 12)} years and {timeSaved % 12} months</p>
            <p><strong>Interest Saved:</strong> ${interestSaved.toFixed(2)}</p>
          </div>

          <button style={{ marginTop: "20px" }} onClick={handleGoBack}>
            Go Back
          </button>
        </>
      )}
    </div>
  );
};

export default MortgageCalculatorApp;
