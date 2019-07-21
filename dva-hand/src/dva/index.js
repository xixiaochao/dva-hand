/**
 *  手写dva -- 封装
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {combineReducers,createStore, applyMiddleware} from 'redux';
import {Provider,connect} from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import {createHashHistory} from 'history';
import {
    routerMiddleware, // 创建router中间件
    connectRouter, // 用来创建router reducer
    ConnectedRouter, // 取代Router
} from 'connected-react-router';
export {connect};
export default function(options){
    const app = {
        _models:[], // 定义的模型
        model, // 添加模型的方法
        _router:null, // 存放路由定义的函数
        router,
        start
    }
    function model(model){
        app._models.push(model);
    }
    function router(routerConfig){
        app._router = routerConfig;
    }
    function start(containerId){
        let history = options.history||createHashHistory();
        let reducers = {
            router:connectRouter(history) // 是用来把路径信息同步到仓库中去的
        };
        for(let i = 0;i < app._models.length;i++){
            let model = app._models[i];

            reducers[model.namespace] = function(state=model.state,action){
                let actionType = action.type; // 取得动作的类型 'counter/add'
                let [namespace,type] = actionType.split('/');
                if(model.namespace === namespace){
                    let reducer = model.reducers[type];
                    if(reducer){
                        return reducer(state,action);
                    }
                }
                return state;
            }
        }
        let finalReducer = combineReducers(reducers);
        finalReducer = function(state,action){
            let newState = finalReducer(state,action);
            options.onStatechange&&options.onStatechange(newState);
            return newState;
            
        }
        let sagaMiddleware = createSagaMiddleware();
        if(options.onAction){
            if(typeof options.onAction == 'function'){
                options.onAction = [options.onAction];
            }
        }else{
            options.onAction = [];
        }
        let store = createStore(finalReducer,options.initialState||{},applyMiddleware(
            routerMiddleware(history),sagaMiddleware,...options.onAction));
        function *rootSaga(){
            const {takeEvery} = sagaEffects;
            for(const model of app._models){
                const effects = model.effects;
                for(const key in effects){ // key = asyncAdd
                    // 监听每一个动作，当动作发生的时候，执行对应的SAGA
                    yield takeEvery(`${model.namespace}/${key}`,function* (action){
                        try{
                            yield effects[key](action,sagaEffects);
                        }catch(error){
                            options.onError&&options.onError(error);
                        }
                    });
                }
            }
        }
        sagaMiddleware.run(rootSaga);
        let App = app._router({history});
        ReactDOM.render(
            <Provider store = {store}>
                <ConnectedRouter history={history}>
                    {App}
                </ConnectedRouter>
            </Provider>,document.querySelector(containerId)
        );
    }
    return app;
}