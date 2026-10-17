import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";

export default function OptionChain(props) {
    const { underlying, expiry, setInstrumentKey, setTradingSymbol } = props;
    const [underlyingClosePrice, setUnderlyingPrice] = useState(0); 
    const [chain, setChain] = useState([]);

    function chainPreProcessing(arr) {
        const tempChain = {};
        
        arr.forEach((item) => {
            const strike = item.strike_price;
            const opType = item.instrument_type;

            if (!(strike in tempChain)) {
                tempChain[strike] = {};
            }
            tempChain[strike][opType] = item;
        });

        return Object.values(tempChain);
    };

    function onClickContract(instrumentKey, symbol) {
        setInstrumentKey(instrumentKey);
        setTradingSymbol(symbol);
    }

    useEffect(() => {
        axios.get("http://localhost:3000/api/option-chain", {
            params: {
                underlyingInstrumentKey : underlying,
                expiryDate : expiry
            }
        })
        .then((response) => {
            const rawChain = response.data.data;
            const processedChain = chainPreProcessing(rawChain);
            setChain(processedChain);
        })
        .catch((err) => {
            console.log(err);
        });

        axios.get("http://localhost:3000/api/get-instrument-price", {
            params: {
                instrumentKey: underlying,
                date: expiry
            }
        })
        .then((response) => {
            setUnderlyingPrice(response.data);
        })
        .catch((err) => {
            console.log(err);
        });

    }, [underlying, expiry])
        
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableBody>
                    {chain.map((c) => {
                        const strikePrice = c.PE.strike_price; 
                        return (
                            <TableRow key={strikePrice}>
                                <TableCell align="center" style={{backgroundColor: strikePrice <= underlyingClosePrice ? "#f8f8f8" : "white"}}>
                                    <Button variant="outlined" color="primary" onClick={() => onClickContract(c.CE.instrument_key, c.CE.trading_symbol)}>
                                        CE
                                    </Button>
                                </TableCell>
                                <TableCell align="center">{strikePrice}</TableCell>
                                <TableCell align="center" style={{backgroundColor: strikePrice > underlyingClosePrice ? "#f8f8f8" : "white"}}>
                                    <Button variant="outlined" color="secondary" onClick={() => onClickContract(c.PE.instrument_key, c.PE.trading_symbol)}>
                                        PE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
