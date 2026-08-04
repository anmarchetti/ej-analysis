import React, { Component, Ref } from 'react';
import { Handles, Rail, Slider, Ticks, Tracks } from 'react-compound-slider';
import classNames from 'classnames';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

export interface ICompoundSliderProps extends IComponentWithDictionary {
    max: number;
    min: number;

    onSlide: (values: number[]) => void;

    values: number[];
    getValue?: (value: number) => string;
    isDisabled?: boolean;
    onSliding?: (values: number[]) => void;
    ruler?: number | number[];
    sliderRef?: Ref<Slider<HTMLDivElement>>;
    step?: number;
}

export function Handle({
    handle: { id, value, percent, getValue = (value: number): string => String(value) },
    getHandleProps,
    isDisabled,
}) {
    return (
        <div
            className={classNames('compound-slider__handle-ball', { 'compound-slider-disable': isDisabled })}
            data-tid='compound-slider-handle'
            style={{ left: `${percent}%` }}
            {...getHandleProps(id)}
        >
            {!isDisabled && (
                <div data-tid='compound-slider-handle-value' className='compound-slider__handle-value'>
                    {getValue(value)}
                </div>
            )}
        </div>
    );
}

export function Track({ source, target, getTrackProps, isDisabled }) {
    return (
        <div
            className={classNames('compound-slider__track', { 'compound-slider-disable': isDisabled })}
            data-tid='compound-slider-track'
            style={{
                left: `${source.percent}%`,
                width: `${target.percent - source.percent}%`,
            }}
            {
                ...getTrackProps() /* this will set up events if you want it to be clickeable (optional) */
            }
        />
    );
}

export function Tick({ tick, count }) {
    return (
        <div className='compound-slider__ticks' data-tid='compound-slider-tick'>
            <div
                className='tick-ruler'
                style={{
                    left: `${tick.percent}%`,
                }}
            />
            <div
                className='tick-value'
                style={{
                    marginLeft: `${-(100 / count) / 2}%`,
                    width: `${100 / count}%`,
                    left: `${tick.percent}%`,
                }}
            >
                {tick.value}
            </div>
        </div>
    );
}

export class CompoundSlider extends Component<ICompoundSliderProps> {
    // Slider library sometimes return NaN instead null
    private readonly onSlide = values => {
        const correctValues = values.map(e => (isNaN(e) ? null : e));
        this.props.onSlide(correctValues);
    };

    private readonly onSliding = values => {
        const correctValues = values.map(e => (isNaN(e) ? null : e));

        if (this.props.onSliding) this.props.onSliding(correctValues);
    };

    render() {
        let tickProps = {};

        if (this.props.ruler) {
            if (Array.isArray(this.props.ruler)) {
                tickProps = { values: this.props.ruler };
            } else if (typeof this.props.ruler === 'number') {
                tickProps = { count: this.props.ruler };
            }
        }

        let values = toJS(this.props.values);
        const v0 = values[0];
        const v1 = values[1];

        if (v0 > this.props.max || v0 < this.props.min || v1 > this.props.max || v1 < this.props.min) {
            values = [this.props.min, this.props.max];
        }

        return (
            <div className='compound-slider-wr'>
                <Slider
                    ref={this.props.sliderRef}
                    className='compound-slider-box'
                    domain={[this.props.min, this.props.max]}
                    step={this.props.step ?? 1}
                    mode={1}
                    values={values}
                    onChange={this.onSlide}
                    onUpdate={this.onSliding}
                    disabled={this.props.isDisabled}
                >
                    <Rail>{({ getRailProps }) => <div className='compound-slider__rail' {...getRailProps()} />}</Rail>

                    <Handles>
                        {({ handles, getHandleProps }) => (
                            <div className='slider-handles'>
                                {handles.map((handle, index) => {
                                    // When we have similar max and min we should set handles to start and end
                                    const correctHandle = {
                                        ...handle,
                                        getValue: this.props.getValue,
                                        percent:
                                            this.props.min === this.props.max && index === 1 ? 100 : handle.percent,
                                    };

                                    return (
                                        <Handle
                                            key={handle.id}
                                            handle={correctHandle}
                                            getHandleProps={getHandleProps}
                                            isDisabled={this.props.isDisabled}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </Handles>

                    <Tracks left={false} right={false}>
                        {({ tracks, getTrackProps }) => (
                            <div className='slider-tracks'>
                                {tracks.map(({ id, source, target }) => {
                                    // When we have similar max and min track should be visible
                                    const correctTarget = {
                                        ...target,
                                        percent: this.props.min === this.props.max ? 100 : target.percent,
                                    };

                                    return (
                                        <Track
                                            key={id}
                                            source={source}
                                            target={correctTarget}
                                            getTrackProps={getTrackProps}
                                            isDisabled={this.props.isDisabled}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </Tracks>

                    {this.props.ruler ? (
                        <Ticks {...tickProps}>
                            {({ ticks }) => (
                                <div className='slider-ticks'>
                                    {ticks.map(tick => (
                                        <Tick key={tick.id} tick={tick} count={ticks.length} />
                                    ))}
                                </div>
                            )}
                        </Ticks>
                    ) : null}
                </Slider>
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
}))(observer(class WrappedCompoundSlider extends CompoundSlider {}));
