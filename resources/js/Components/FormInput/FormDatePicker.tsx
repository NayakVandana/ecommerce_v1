import React, { useMemo } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import InputWrapper from "./InputWrapper";
import moment from "moment";

const FormDatePicker = (props: any) => {
    const { 
        icon, 
        isoptional, 
        iconColor, 
        rightIconTsx, 
        helpertext, 
        isRequired, 
        error, 
        rightIcon, 
        bg, 
        isDisabled, 
        id, 
        leftIconTsx, 
        isReadOnly, 
        title, 
        isRange, 
        useRange, 
        minDate, 
        handleDateChange, 
        value, 
        className, 
        popoverDirection, 
        disabled = false, 
        noMaxDate = false,
        noMinLimit = false 
    } = props;

    let today = new Date();
    let threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    const onChange = (date: any) => {
        // Format the date using Moment.js
        let formattedStartDate = date?.startDate ? moment(date.startDate).format("YYYY-MM-DD") : "";
        let formattedEndDate = date?.endDate ? moment(date.endDate).format("YYYY-MM-DD") : "";

        if (!date?.startDate) {
            formattedStartDate = "";
            formattedEndDate = "";
        }

        if (handleDateChange) {
            handleDateChange({ startDate: formattedStartDate, endDate: formattedEndDate });
        }
    };

    // Convert value format if needed - use useMemo to prevent unnecessary recalculations
    const dateValue = useMemo(() => {
        if (!value) {
            return null;
        }
        
        if (typeof value === 'object' && value !== null) {
            if (value.startDate && value.endDate) {
                // Handle string dates (YYYY-MM-DD format)
                let startDate: Date;
                let endDate: Date;
                
                try {
                    if (typeof value.startDate === 'string') {
                        startDate = new Date(value.startDate);
                    } else if (value.startDate instanceof Date) {
                        startDate = value.startDate;
                    } else {
                        startDate = new Date(value.startDate);
                    }
                    
                    if (typeof value.endDate === 'string') {
                        endDate = new Date(value.endDate);
                    } else if (value.endDate instanceof Date) {
                        endDate = value.endDate;
                    } else {
                        endDate = new Date(value.endDate);
                    }
                    
                    // Validate dates
                    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                        return {
                            startDate: startDate,
                            endDate: endDate
                        };
                    }
                } catch (e) {
                    console.error('Error parsing date range:', e);
                    return null;
                }
            } else if (value.startDate) {
                let startDate: Date;
                
                try {
                    if (typeof value.startDate === 'string') {
                        startDate = new Date(value.startDate);
                    } else if (value.startDate instanceof Date) {
                        startDate = value.startDate;
                    } else {
                        startDate = new Date(value.startDate);
                    }
                    
                    // Validate date
                    if (!isNaN(startDate.getTime())) {
                        return {
                            startDate: startDate,
                            endDate: startDate
                        };
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                    return null;
                }
            }
        } else if (value && !isRange) {
            // Single date mode
            let singleDate: Date;
            
            try {
                if (typeof value === 'string') {
                    singleDate = new Date(value);
                } else if (value instanceof Date) {
                    singleDate = value;
                } else {
                    singleDate = new Date(value);
                }
                
                if (!isNaN(singleDate.getTime())) {
                    return singleDate;
                }
            } catch (e) {
                console.error('Error parsing single date:', e);
                return null;
            }
        }
        
        return null;
    }, [value, isRange]);

    // Ensure value is in correct format for the datepicker
    // For range mode with no value, pass null (not undefined or empty object)
    const safeValue = dateValue !== null && dateValue !== undefined ? dateValue : null;

    return (
        <InputWrapper {...props}>
            <Datepicker
                inputClassName={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${className || ''}`}
                placeholder={isRange ? "Select Date Range" : "DD-MMM-YYYY"}
                asSingle={!isRange}
                useRange={useRange}
                value={safeValue}
                onChange={onChange}
                maxDate={noMaxDate ? null : new Date()}
                displayFormat={isRange ? "DD MMM YY" : 'DD MMM YYYY'}
                minDate={noMinLimit ? null : (minDate || threeYearsAgo)}
                showShortcuts={isRange}
                popoverDirection={popoverDirection || "down"}
                dateLooking="middle"
                disabled={disabled || isDisabled}
                primaryColor="green"
            />
        </InputWrapper>
    );
};

export default React.memo(FormDatePicker);

