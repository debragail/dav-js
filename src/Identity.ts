import { Observable, DavID, ID } from './common-types';
import IConfig from './IConfig';
import NeedFilterParams from './NeedFilterParams';
import NeedParams from './NeedParams';
import BidParams from './BidParams';
import MissionParams from './MissionParams';
import MessageParams from './MessageParams';
import Need from './Need';
import Bid from './Bid';
import Message from './Message';
import Mission from './Mission';
import Kafka from './Kafka';
import axios from 'axios';

/**
 * @class The DavSDK Identity class represent registered DAV identity instance.
 */
export default class Identity {

  private _needTypeId: ID;

  constructor(public id: ID, public davID: DavID, private config: IConfig) { /**/ }

  private async registerNewTopic() {
    const topic = Kafka.generateTopicId(); // Channel#2
    try {
      await Kafka.createTopic(topic, this.config);
    } catch (err) {
      throw new Error(`Topic registration failed: ${err}`);
    }
    return topic;
  }

  /**
   * @method publishNeed Used to create a new need and publish it to the relevant service providers.
   * @param params the need parameters.
   * @returns the created need.
   */
  public async publishNeed<T extends NeedParams, U extends MessageParams>(params: T): Promise<Need<T, U>> {
    const bidsChannelName = await this.registerNewTopic(); // Channel#3
    params.id = bidsChannelName;
    await axios.post(`${this.config.apiSeedUrls[0]}/publishNeed/:${bidsChannelName}`, params);
    return new Need<T, U>(bidsChannelName, params, this.config);
  }

  /**
   * @method needsForType Used to subscribe for specific needs (filtered by params).
   * @param params the filter parameters.
   * @param channelId used to get an observable for needs you already subscribed.
   * @returns Observable for needs subscription.
   */
  public async needsForType<T extends NeedParams, U extends MessageParams>(params: NeedFilterParams, channelId?: ID):
  Promise<Observable<Need<T, U>>> {
    let identityChannelName = channelId || this._needTypeId;
    if (!identityChannelName) {
      identityChannelName = await this.registerNewTopic();
      this._needTypeId = identityChannelName;
      try {
        await axios.post(`${this.config.apiSeedUrls[0]}/needsForType/:${identityChannelName}`, params);
      } catch (err) {
        throw new Error(`Needs registration failed: ${err}`);
      }
    }
    const stream: Observable<T> = await Kafka.paramsStream(identityChannelName, this.config);
    const observable = Observable.fromObservable(stream.map((needParams: T) =>
        new Need<T, U>(identityChannelName, needParams, this.config)), stream.topic);
    return observable;
  }
  /**
   * @method missions Used to subscribe for missions.
   * @param channelId used to get an observable for existed subscription.
   * @returns Observable for missions subscription.
   */
  public async missions<T extends MissionParams, U extends MessageParams>(channelId?: ID): Promise<Observable<Mission<T, U>>> {
    let identityChannelName = channelId || this._needTypeId;
    if (!identityChannelName) {
      identityChannelName = await this.registerNewTopic();
      this._needTypeId = identityChannelName;
    }
    const stream: Observable<T> = await Kafka.paramsStream(identityChannelName, this.config); // Channel#2
    const messageStream = stream.map(async (params: T) => {
      return new Mission<T, U>(identityChannelName, params, this.config);
    })
    .map((promise) => Observable.fromPromise(promise))
    .mergeAll();
    return Observable.fromObservable(messageStream, stream.topic);
  }
  /**
   * @method messages Used to subscribe for messages.
   * @param channelId used to get an observable for existed subscription.
   * @returns Observable for messages subscription.
   */
  public async messages<T extends MessageParams>(channelId?: ID): Promise<Observable<Message<T>>> {
    let identityChannelName = channelId || this._needTypeId;
    if (!identityChannelName) {
      identityChannelName = await this.registerNewTopic();
      this._needTypeId = identityChannelName;
    }
    const stream = await Kafka.paramsStream(identityChannelName, this.config); // Channel#2
    const messageStream = stream.map((params: MessageParams) =>
        new Message<T>(identityChannelName, params, this.config));
    return Observable.fromObservable(messageStream, stream.topic);
  }
  /**
   * @method need Used to restore existed need.
   * @param params the need parameters.
   * @returns the restored need.
   */
  public need<T extends NeedParams, U extends MessageParams>(params: T): Need<T, U> {
    const selfId = this._needTypeId || params.id;
    return new Need(selfId, params, this.config);
  }
  /**
   * @method bid Used to restore existed bid.
   * @param params the bid parameters.
   * @returns the restored bid.
   */
  public bid<T extends BidParams, U extends MessageParams>(bidSelfId: ID, params: T): Bid<T, U> {
    return new Bid(bidSelfId, params, this.config);
  }
  /**
   * @method mission Used to restore existed mission.
   * @param params the mission parameters.
   * @returns the restored mission.
   */
  public mission<T extends MissionParams, U extends MessageParams>(missionSelfId: ID, params: T): Mission<T, U> {
    return new Mission(missionSelfId, params, this.config);
  }
}
