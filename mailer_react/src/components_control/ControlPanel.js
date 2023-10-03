
import { useState, useEffect, useContext } from 'react'
import { isAuthedContext, TokenContext } from './ControlContexts';
import { Buffer } from 'buffer';

export default function ControlPanel (){
    const [commandsJsx, setCommandsJsx] = useState('');

    const [commandName, setCommandName] = useState('');
    const [commandText, setCommandText] = useState('');
    const [commandArgs, setCommandArgs] = useState('');
    const [run, setRun] = useState(false);
    const [save, setSave] = useState(false);

    const [commandStdout, setCommandStdout] = useState('');
    const [lastCommand, setLastCommand] = useState('');

    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {token, setToken} = useContext(TokenContext);
    
    useEffect(()=>{
        LoadCommands();
    }, [is_authed])

    useEffect( ()=> {
        if (run === true) {
            setCommandStdout('waiting for end...');
            setLastCommand('executing...');
            if (token && is_authed){
                fetch([
                    'https://api.svdgod.ru/query?action=control_exec_command',
                    'command='+commandText,
                    'args='+commandArgs,
                    'token='+token
                ].join('&')).then(response => response.json())
                    .then(data => {
                        console.log(data)
                        if (data.error){
                            console.log(data.error);
                            setAuth(false);
                            setToken('');
                            return;
                        }

                        if (data.stdout && data.stdout.data){
                            if( data.stdout.data.length > 0){
                                setCommandStdout(Buffer.from(data.stdout).toString());
                            }
                        }

                        if (data.stderr && data.stderr.data){
                            if( data.stderr.data.length > 0){
                                setCommandStdout(Buffer.from(data.stderr).toString());
                            }
                        }

                        if (data.stderr === null && data.stdout === null){
                            setCommandStdout('no output');
                        }
                        
                        ResetInputs();
                    })
                    .catch(error => console.log(error));
            }
        }

        if (save === true) {
            if (token && is_authed){
                fetch([
                    'https://api.svdgod.ru/query?action=control_add_command',
                    'name='+commandName,
                    'text='+commandText,
                    'args='+commandArgs,
                    'token='+token
                ].join('&')).then(response => response.json())
                    .then(data => {
                        console.log(data)
                        if (data.error){
                            console.log(data.error);
                            setAuth(false);
                            setToken('');
                            return;
                        }

                        ResetInputs();
                        LoadCommands();
                        
                    })
                    .catch(error => console.log(error));
            }
        }
    }, [run, save])

    const ResetInputs = () => {
        setLastCommand(commandText);
        setCommandName('');
        setCommandText('');
        setCommandArgs('');
        setRun(false);
        setSave(false);
    }

    const LoadCommands = () => {
        if (token && is_authed){
            fetch([
                'https://api.svdgod.ru/query?action=control_load_commands',
                'token='+token
            ].join('&')).then(response => response.json()) 
            .then(data => {
                console.log(data)
                if (data.error){
                    console.log(data.error);
                    setAuth(false);
                    setToken('');
                    return;
                }
                if (data.commands && data.commands.length > 0){
                    setCommandsJsx('');
                    data.commands.map( ({name, text, args}) => {
                        setCommandsJsx( prev => {
                            return [...prev, <button key={prev.length + 1} className='ready-command' onClick={() => {
                                setCommandName(name);
                                setCommandText(text);
                                setCommandArgs(args);
                                setRun(true);
                            }}>{name}</button>]
                        })
                    })
                }
                
                
                
            })
            .catch(error => console.log(error));
        }
    }

    if (is_authed && token){
            return (<div className='control-panel'>
                    <div className='commands'>{commandsJsx}</div>
                    
                    <input type="text" value={commandName} name='commandName' id="commandName" placeholder='command name'
                        onChange={ (e) => setCommandName(e.target.value) } />
                    <input type="text" value={commandText} name='commandText' id="commandText" placeholder='command path'
                        onChange={ (e) => setCommandText(e.target.value) } />
                    <input type="text" value={commandArgs} name='commandArgs' id="commandArgs" placeholder='command arguments'
                        onChange={ (e) => setCommandArgs(e.target.value) } />
                        <br></br>
                    <button type="button" onClick={ () => {
                        setCommandName(commandName);
                        setCommandText(commandText);
                        setCommandArgs(commandArgs);
                        setRun(true);
                    }}>Send</button>
                    <button type="button" onClick={ () => {
                        setCommandName(commandName);
                        setCommandText(commandText);
                        setCommandArgs(commandArgs);
                        setSave(true);
                    }}>Save</button>
                    <div className='last_command'>Last command: {lastCommand}</div>
                    <pre className='command_display'>{commandStdout}</pre>
            </div>)
    } else {
        return (<div className='emptyDiv'></div>)
    }

}
