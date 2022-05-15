export default class UsersService {
    private readonly client: IInvestSdk;
    private readonly isSandbox: boolean;

    constructor(client: IInvestSdk, isSandbox: boolean) {
        this.client = client;
        this.isSandbox = isSandbox;

        console.log(this.client, this.isSandbox);
    }
}
