/**
 *  计数器
 */
import React from 'react';
import dva,{connect} from 'dva';
import {Router,Route,Link,routerRedux} from './dva/router';
import {createBrowserHistory} from 'history';
//import logger from 'redux-logger';
function delay(ms){
    return new Promise(function(resolve){
        setTimeout(() => {
            resolve();
        },ms);
    });
}
let history = createBrowserHistory();
function logger(getState,dispatch){
    return function(next){
        return function(action){
            console.log('老状态',getState());
            next(action);
            console.log('新状态',getState());
        }
    }
}
let app = dva({
    history,
    initialState:{counter:{number:5}},
    onError:(error)=>alert(error),
    onAction:logger, // 可以支持中间件
    onStateChange:state=>localStorage.setItem('state',JSON.stringify(state))
});
app.model({
    namespace:'counter',
    state:{number:0},
    reducers:{
        add(state,action){
            return {number:state.number+action.payload||state.number+1}
        }
    },
    effects:{
        *asyncAdd(action,{call,put}){
            yield call(delay,2000);
            yield put({type:'counter/add'});
            throw new Error('asyncAddError');
        },
        *goto({payload:{pathname}},{call,put}){
            yield put(routerRedux.push(pathname)); //connected-react-router
        }
    }
});

const Counter = connect(state => state.counter)(
    props => (
        <>
            <p>{props.number}</p>
            <button onClick={()=>props.dispatch({type:'counter/add',payload:2})}>+</button>
            <button onClick={()=>props.dispatch({type:'counter/asyncAdd'})}>异步加1</button>
            <button onClick={()=>props.dispatch({type:'counter/goto',payload:{pathname:'/'}})}>跳转到首页</button>
        </>
    )
)
const Home = () => <div>首页</div>
app.router(({history})=>(
    <Router history = {history}>
        <>
            <Link to="/">首页</Link><br/><Link to="/counter">计数器</Link>
            <Route path="/" component={Home}/>
            <Route path="/counter" component={Counter}/>
        </>
    </Router>
));
app.start('#root');

/**
 *      antdesignpro dva+antdesign
 * 
 *  dva 如何跟 umi 结合使用？ dva 跟 umi 结合使用后，还用写 router 吗？
 *    约定式路由
 *    create-react-app roadhog umi dva
 *    create-react-app 内置了 webpack 配置的脚手架
 *    roadhog 相当于 一个可配置的 create-react-app
 *    umi=roadhog+路由系统
 *    dva管理数据流的
 * 
 *  用了dva是不是react的中间件的库就用不了啦？
 *      当然不是，可以的
 *   支持redux-persist持久化
 * 
 */